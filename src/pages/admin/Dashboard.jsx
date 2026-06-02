// src/pages/admin/Dashboard.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getPostsBySection,
  createPost,
  updatePost,
  deletePost,
} from "../../lib/supabaseClient";

export default function AdminDashboard() {
  const [tab, setTab] = useState(0); // 0 = Sections, 1 = Posts

  // Sections state
  const [sections, setSections] = useState([]);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [sectionEditing, setSectionEditing] = useState(null);
  const [sectionName, setSectionName] = useState("");

  // Posts state
  const [posts, setPosts] = useState([]);
  const [postOpen, setPostOpen] = useState(false);
  const [postEditing, setPostEditing] = useState(null);
  const [postForm, setPostForm] = useState({ title: "", content: "", section_slug: "" });

  // --- Section helpers -------------------------------------------------
  const fetchSections = async () => {
    try {
      const data = await getSections();
      setSections(data);
    } catch (e) {
      console.error(e);
    }
  };

  const [sectionDesc, setSectionDesc] = useState('');

  const openSectionEdit = (sec) => {
    setSectionEditing(sec.id);
    setSectionName(sec.title);
    setSectionDesc(sec.description || '');
    setSectionOpen(true);
  };

  const submitSection = async () => {
    if (!sectionName) return;
    try {
      const slug = sectionName.toLowerCase().replace(/\s+/g, '-');
      if (sectionEditing) {
        const updated = { title: sectionName, description: sectionDesc, slug };
        await updateSection(sectionEditing, updated);
        setSectionEditing(null);
      } else {
        const newSec = { title: sectionName, description: sectionDesc, slug };
        await createSection(newSec);
      }
      setSectionName("");
      setSectionDesc("");
      setSectionOpen(false);
      fetchSections();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteSectionHandler = async (id) => {
    try {
      await deleteSection(id);
      fetchSections();
    } catch (e) {
      console.error(e);
    }
  };

  // --- Post helpers ----------------------------------------------------
  const fetchPosts = async () => {
    try {
      // Passing empty string returns all posts
      const data = await getPostsBySection("");
      setPosts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const openPostEdit = (post) => {
    setPostEditing(post.id);
    setPostForm({ title: post.title, content: post.content, section_slug: post.section_slug });
    setPostOpen(true);
  };

  const submitPost = async () => {
    const { title, content, section_slug } = postForm;
    if (!title) return;
    try {
      if (postEditing) {
        await updatePost(postEditing, { title, content, section_slug });
        setPostEditing(null);
      } else {
        await createPost({ title, content, section_slug });
      }
      setPostForm({ title: "", content: "", section_slug: "" });
      setPostOpen(false);
      fetchPosts();
    } catch (e) {
      console.error(e);
    }
  };

  const deletePostHandler = async (id) => {
    try {
      await deletePost(id);
      fetchPosts();
    } catch (e) {
      console.error(e);
    }
  };

  // --- Effect ----------------------------------------------------------
  useEffect(() => {
    fetchSections();
    fetchPosts();
  }, []);

  // --- Render ----------------------------------------------------------
  return (
    <Box sx={{ p: 3 }}>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Sections" />
        <Tab label="Posts" />
      </Tabs>

      {/* Sections Tab */}
      {tab === 0 && (
        <Box>
          <Button variant="contained" onClick={() => setSectionOpen(true)} sx={{ mb: 2 }}>
            Add Section
          </Button>
          <List>
                {sections.map((sec) => (
                  <ListItem key={sec.id} secondaryAction={
                    <>
                      <IconButton onClick={() => openSectionEdit(sec)}><EditIcon /></IconButton>
                      <Button color="error" onClick={() => deleteSectionHandler(sec.id)}>Delete</Button>
                    </>
                  }>
                    <ListItemText
                      primary={sec.title}
                      secondary={`${sec.description || ''}${sec.description ? ' • ' : ''}${sec.slug}`}
                    />
                  </ListItem>
                ))}
          </List>
        </Box>
      )}

      {/* Posts Tab */}
      {tab === 1 && (
        <Box>
          <Button variant="contained" onClick={() => setPostOpen(true)} sx={{ mb: 2 }}>
            Add Post
          </Button>
          <List>
            {posts.map((post) => (
              <ListItem key={post.id} secondaryAction={
                <>
                  <IconButton onClick={() => openPostEdit(post)} size="small"><EditIcon /></IconButton>
                  <Button color="error" onClick={() => deletePostHandler(post.id)} size="small">Delete</Button>
                </>
              }>
              >
                <ListItemText primary={post.title} secondary={post.section_slug} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Section Dialog */}
      <Dialog open={sectionOpen} onClose={() => setSectionOpen(false)}>
        <DialogTitle>{sectionEditing ? "Edit Section" : "Add New Section"}</DialogTitle>
        <DialogContent>
          <TextField label="Section Name" value={sectionName} onChange={(e) => setSectionName(e.target.value)} fullWidth />
          <TextField label="Description" value={sectionDesc} onChange={(e) => setSectionDesc(e.target.value)} fullWidth multiline rows={3} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSectionOpen(false)}>Cancel</Button>
          <Button onClick={submitSection} variant="contained">{sectionEditing ? "Update" : "Add"}</Button>
        </DialogActions>
      </Dialog>

      {/* Post Dialog */}
      <Dialog open={postOpen} onClose={() => setPostOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{postEditing ? "Edit Post" : "Add New Post"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField label="Title" value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} fullWidth />
          <TextField label="Content" value={postForm.content} onChange={(e) => setPostForm({ ...postForm, content: e.target.value })} multiline rows={4} fullWidth />
          <TextField label="Section" value={postForm.section_slug} onChange={(e) => setPostForm({ ...postForm, section_slug: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPostOpen(false)}>Cancel</Button>
          <Button onClick={submitPost} variant="contained">{postEditing ? "Update" : "Create"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
