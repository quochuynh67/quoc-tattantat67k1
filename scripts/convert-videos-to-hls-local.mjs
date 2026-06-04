import fs from 'node:fs/promises'
import fsSync from 'node:fs'
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
            if (entry.isDirectory()) {
                await walk(fullPath)
            } else if (entry.isFile() && isMp4(entry.name)) {
                out.push(fullPath)
            }
        }
    }
    await walk(dir)
    return out
}

async function convertOne(inputFile, outputDir) {
    const baseName = path.basename(inputFile, path.extname(inputFile))
    const hlsDir = path.join(outputDir, baseName)

    await fs.mkdir(hlsDir, { recursive: true })

    const playlistFile = path.join(hlsDir, 'index.m3u8')
    const segPattern = path.join(hlsDir, 'seg_%05d.ts')

    await execFileAsync('ffmpeg', [
        '-y',
        '-i', inputFile,
        '-profile:v', 'baseline',
        '-level', '3.0',
        '-start_number', '0',
        '-hls_time', '6',
        '-hls_list_size', '0',
        '-f', 'hls',
        '-hls_segment_filename', segPattern,
        playlistFile,
    ])

    return { inputFile, playlistFile, hlsDir }
}

async function main() {
    const args = process.argv.slice(2)

    if (!args[0]) {
        console.error('Usage:')
        console.error('  node convert-videos-to-hls-local.mjs <file.mp4> [output-dir]')
        console.error('  node convert-videos-to-hls-local.mjs <folder>   [output-dir]')
        process.exit(1)
    }

    const inputPath = path.resolve(args[0])
    const stat = await fs.stat(inputPath).catch(() => null)

    if (!stat) {
        console.error(`Path not found: ${inputPath}`)
        process.exit(1)
    }

    let mp4Files = []

    if (stat.isFile()) {
        if (!isMp4(inputPath)) {
            console.error('File is not an MP4:', inputPath)
            process.exit(1)
        }
        mp4Files = [inputPath]
    } else if (stat.isDirectory()) {
        mp4Files = await listAllMp4s(inputPath)
        if (!mp4Files.length) {
            console.log('No MP4 files found in:', inputPath)
            return
        }
    } else {
        console.error('Input must be a file or directory')
        process.exit(1)
    }

    for (const file of mp4Files) {
        const outputDir = args[1]
            ? path.resolve(args[1])
            : path.dirname(file)

        console.log(`Converting: ${file}`)
        const result = await convertOne(file, outputDir)
        console.log(`  -> ${result.playlistFile}`)
    }

    console.log('Done.')
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
