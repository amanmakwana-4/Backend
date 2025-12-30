import mongoose from 'mongoose';

const referenceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  }
}, { _id: false });

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  originalContent: {
    type: String,
    required: true
  },
  rewrittenContent: {
    type: String,
    default: null
  },
  references: {
    type: [referenceSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['original', 'rewritten'],
    default: 'original'
  },
  source: {
    type: String,
    default: 'beyondchats'
  },
  sourceUrl: {
    type: String,
    default: null
  },
  metadata: {
    wordCount: { type: Number, default: 0 },
    readingTime: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Generate slug from title before saving
articleSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Calculate word count and reading time
  if (this.originalContent) {
    const content = this.rewrittenContent || this.originalContent;
    const wordCount = content.split(/\s+/).length;
    this.metadata.wordCount = wordCount;
    this.metadata.readingTime = Math.ceil(wordCount / 200); // 200 words per minute
  }
  
  next();
});

// Index for searching
articleSchema.index({ title: 'text', originalContent: 'text' });
articleSchema.index({ status: 1 });
articleSchema.index({ createdAt: -1 });

const Article = mongoose.model('Article', articleSchema);

export default Article;
