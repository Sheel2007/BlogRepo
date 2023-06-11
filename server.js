const express = require('express');
const fs = require('fs');
const path = require('path');
const markdownIt = require('markdown-it')
const marked = require('marked');
const fm = require('front-matter');
const md = new markdownIt();


const app = express();
const PORT = 3000;

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// Route for the blog index page
app.get('/blog', (req, res) => {
  const posts = getBlogPosts();
  res.render('index', { posts });
});

// Route for individual blog posts
app.get('/blog/:slug', (req, res) => {
  const { slug } = req.params;
  const post = getBlogPostBySlug(slug);
  if (post) {
    res.render('post', { post });
  } else {
    res.status(404).send('Post not found');
  }
});

// Helper function to get all blog posts
function getBlogPosts() {
  const postsDir = path.join(__dirname, 'blog', 'posts');
  const postFiles = fs.readdirSync(postsDir);
  const posts = postFiles
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const postPath = path.join(postsDir, file);
      const content = fs.readFileSync(postPath, 'utf-8');
      const slug = path.parse(file).name;

      // Extract the date from the front matter
      const frontMatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
      const frontMatter = frontMatterMatch ? frontMatterMatch[1] : '';
      const dateMatch = frontMatter.match(/^date:\s*(.+)$/im);
      const date = dateMatch ? dateMatch[1] : '';

      const metadata = extractMetadata(content);
      const excerpt = extractExcerpt(content);
      const truncatedContent = truncateContent(content, 150); // Truncate the content
      const html = md.render(truncatedContent);

      const { title, heading } = metadata;

      const imagePath = `/images/${slug}.jpg`; // Path to the associated image
      // console.log(content);
      return { slug, date, title, excerpt, imagePath, html };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return posts;
}

function extractMetadata(content) {
  const metadata = {};
  const lines = content.split('\n');

  let index = 0;
  while (index < lines.length && lines[index].trim() !== '---') {
    const line = lines[index].trim();
    if (line) {
      const [key, value] = line.split(':').map((part) => part.trim());
      metadata[key] = value;
    }
    index++;
  }

  const html = lines.slice(index + 1).join('\n').trim();

  return { metadata, html };
}

// Modify the extractExcerpt function to extract only the excerpt text
function extractExcerpt(content) {
  const match = content.match(/excerpt:(.*?)(?:\r?\n|$)/i); // Extract the excerpt text
  if (match && match[1]) {
    const excerpt = match[1].trim();
    return excerpt;
  }
  return '';
}


// Helper function to truncate the content after the excerpt
function truncateContent(content, maxLength) {
  if (content.length > maxLength) {
    const truncatedContent = content.slice(0, maxLength);
    return truncatedContent;
  }
  return content;
}





// Helper function to get a specific blog post by slug
function getBlogPostBySlug(slug) {
  const postPath = path.join(__dirname, 'blog', 'posts', `${slug}.md`);
  if (fs.existsSync(postPath)) {
    const content = fs.readFileSync(postPath, 'utf-8');
    const html = marked(content);
    return { slug, html };
  }
  return null;
}


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});