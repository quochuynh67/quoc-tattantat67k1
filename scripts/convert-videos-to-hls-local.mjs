import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

function isMp4(name) {
    return name.toLowerCase().endsWith('.mp4')
}

async function listAllMp4s(dir) {
    const out = []
    async function walk(current) {
        const entries = await fs.readdir(current, { withFileTypes: true })
        for (const entry of entries) {
            const fullPath = path.join(current, entry.name)
            if (entry.isDirectory()) await walk(fullPath)
            else if (entry.isFile() && isMp4(entry.name)) out.push(fullPath)
        }
    }
    await walk(dir)
    return out
}

function parseArgs(argv) {
    const opts = {
        input: null,
        outputDir: null,
        maxSizeMb: 10,
        startHlsTime: 10,
        minHlsTime: 1,
        stepDown: 1,
        maxRetries: 10,
        videoCodec: 'libx264',
        audioCodec: 'aac',
        preset: 'veryfast',
        crf: 23,
        videoBitrateK: null,
        audioBitrateK: 128,
        fps: null,
        width: null,
        profile: 'main',
        level: '4.0',
    }

    const args = [...argv]
    while (args.length) {
        const a = args.shift()

        if (!opts.input && !a.startsWith('--')) {
            opts.input = path.resolve(a)
            continue
        }

        if (!opts.outputDir && !a.startsWith('--')) {
            opts.outputDir = path.resolve(a)
            continue
        }

        if (a === '--max-size-mb') opts.maxSizeMb = Number(args.shift())
        else if (a === '--start-hls-time') opts.startHlsTime = Number(args.shift())
        else if (a === '--min-hls-time') opts.minHlsTime = Number(args.shift())
        else if (a === '--step-down') opts.stepDown = Number(args.shift())
        else if (a === '--max-retries') opts.maxRetries = Number(args.shift())
        else if (a === '--preset') opts.preset = args.shift()
        else if (a === '--crf') opts.crf = Number(args.shift())
        else if (a === '--video-bitrate-k') opts.videoBitrateK = Number(args.shift())
        else if (a === '--audio-bitrate-k') opts.audioBitrateK = Number(args.shift())
        else if (a === '--fps') opts.fps = Number(args.shift())
        else if (a === '--width') opts.width = Number(args.shift())
        else if (a === '--profile') opts.profile = args.shift()
        else if (a === '--level') opts.level = args.shift()
        else throw new Error(`Unknown arg: ${a}`)
    }

    if (!opts.input) {
        throw new Error(
            [
                'Usage:',
                '  node convert-videos-to-hls.mjs <file-or-folder> [output-dir] [options]',
                '',
                'Options:',
                '  --max-size-mb 10',
                '  --start-hls-time 10',
                '  --min-hls-time 1',
                '  --step-down 1',
                '  --max-retries 10',
                '  --preset veryfast',
                '  --crf 23',
                '  --video-bitrate-k 2500',
                '  --audio-bitrate-k 128',
                '  --fps 30',
                '  --width 1280',
                '  --profile main',
                '  --level 4.0',
            ].join('\n')
        )
    }

    return opts
}

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n))
}

async function removeDirSafe(dir) {
    await fs.rm(dir, { recursive: true, force: true })
}

async function getTsFilesWithSize(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const out = []
    for (const e of entries) {
        if (e.isFile() && e.name.toLowerCase().endsWith('.ts')) {
            const full = path.join(dir, e.name)
            const st = await fs.stat(full)
            out.push({
                file: full,
                sizeBytes: st.size,
                sizeMb: st.size / 1024 / 1024,
            })
        }
    }
    out.sort((a, b) => a.sizeBytes - b.sizeBytes)
    return out
}

async function verifySegments(dir, maxSizeMb) {
    const files = await getTsFilesWithSize(dir)
    const oversized = files.filter(x => x.sizeMb > maxSizeMb)
    const largest = files.length ? files[files.length - 1] : null
    return { files, oversized, largest, ok: oversized.length === 0 }
}

async function runFfmpegHls(inputFile, hlsDir, opts, hlsTime) {
    await fs.mkdir(hlsDir, { recursive: true })

    const playlistFile = path.join(hlsDir, 'index.m3u8')
    const segPattern = path.join(hlsDir, 'seg_%05d.ts')
    const ffArgs = ['-y', '-i', inputFile]

    if (opts.width) {
        ffArgs.push('-vf', `scale='min(${opts.width},iw)':-2`)
    }

    if (opts.fps) {
        ffArgs.push('-r', String(opts.fps))
    }

    const gop = opts.fps ? Math.max(1, Math.round(opts.fps * hlsTime)) : null

    ffArgs.push(
        '-c:v', opts.videoCodec,
        '-preset', opts.preset,
        '-crf', String(opts.crf),
        '-profile:v', opts.profile,
        '-level', opts.level
    )

    if (opts.videoBitrateK) {
        ffArgs.push(
            '-maxrate', `${opts.videoBitrateK}k`,
            '-bufsize', `${opts.videoBitrateK * 2}k`
        )
    }

    if (gop) {
        ffArgs.push(
            '-g', String(gop),
            '-keyint_min', String(gop),
            '-sc_threshold', '0',
            '-force_key_frames', `expr:gte(t,n_forced*${hlsTime})`
        )
    }

    ffArgs.push(
        '-c:a', opts.audioCodec,
        '-b:a', `${opts.audioBitrateK}k`,
        '-ac', '2',
        '-start_number', '0',
        '-hls_time', String(hlsTime),
        '-hls_list_size', '0',
        '-hls_playlist_type', 'vod',
        '-hls_flags', 'independent_segments+temp_file+split_by_time',
        '-hls_segment_filename', segPattern,
        '-f', 'hls',
        playlistFile
    )

    await execFileAsync('ffmpeg', ffArgs)
    return { playlistFile, hlsDir }
}

async function convertOne(inputFile, outputDir, opts) {
    const baseName = path.basename(inputFile, path.extname(inputFile))
    const hlsDir = path.join(outputDir, baseName)

    let hlsTime = opts.startHlsTime
    let attempt = 0
    let lastCheck = null

    while (attempt < opts.maxRetries && hlsTime >= opts.minHlsTime) {
        attempt += 1
        await removeDirSafe(hlsDir)

        console.log(`Attempt ${attempt}: ${baseName}, hls_time=${hlsTime}s`)
        await runFfmpegHls(inputFile, hlsDir, opts, hlsTime)

        const check = await verifySegments(hlsDir, opts.maxSizeMb)
        lastCheck = check

        if (check.ok) {
            return {
                ok: true,
                inputFile,
                hlsDir,
                playlistFile: path.join(hlsDir, 'index.m3u8'),
                hlsTime,
                attempt,
                largestMb: check.largest?.sizeMb ?? 0,
            }
        }

        console.warn(
            `Largest segment: ${check.largest?.sizeMb.toFixed(2)}MB, oversized: ${check.oversized.length}`
        )

        if (hlsTime <= opts.minHlsTime) break
        hlsTime = clamp(hlsTime - opts.stepDown, opts.minHlsTime, opts.startHlsTime)
    }

    await removeDirSafe(hlsDir)

    return {
        ok: false,
        inputFile,
        reason: `Cannot satisfy max segment size ${opts.maxSizeMb}MB`,
        largestMb: lastCheck?.largest?.sizeMb ?? null,
        oversizedCount: lastCheck?.oversized?.length ?? null,
    }
}

async function main() {
    const opts = parseArgs(process.argv.slice(2))

    const stat = await fs.stat(opts.input).catch(() => null)
    if (!stat) throw new Error(`Path not found: ${opts.input}`)

    let mp4Files = []

    if (stat.isFile()) {
        if (!isMp4(opts.input)) throw new Error(`File is not an MP4: ${opts.input}`)
        mp4Files = [opts.input]
    } else if (stat.isDirectory()) {
        mp4Files = await listAllMp4s(opts.input)
        if (!mp4Files.length) {
            console.log(`No MP4 files found in: ${opts.input}`)
            return
        }
    } else {
        throw new Error('Input must be a file or directory')
    }

    for (const file of mp4Files) {
        const outputDir = opts.outputDir ?? path.dirname(file)
        const result = await convertOne(file, outputDir, opts)

        if (!result.ok) {
            console.error(`FAILED: ${file}`)
            console.error(`  reason: ${result.reason}`)
            console.error(`  largest: ${result.largestMb?.toFixed?.(2) ?? 'n/a'}MB`)
            continue
        }

        console.log(`DONE: ${file}`)
        console.log(`  hls_time=${result.hlsTime}s`)
        console.log(`  attempt=${result.attempt}`)
        console.log(`  largest=${result.largestMb.toFixed(2)}MB`)
        console.log(`  playlist=${result.playlistFile}`)
    }
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})