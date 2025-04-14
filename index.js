const fs = require('fs-extra');
const path = require('path');
const { parse } = require('csv-parse/sync');
const glob = require('glob');

// Configuration
const PRODUCTS_CSV_PATH = '../Products.csv';
const BLOG_POSTS_CSV_PATH = '../Blog Posts.csv';
const THEME_TEMPLATES_PATH = '../Theme/templates';

// Main function
async function main() {
  try {
    // Load products data
    const productsData = loadProductsData();
    
    // Check blog posts for draft products
    const blogDraftProducts = findDraftProductsInBlogs(productsData);
    
    // Check product templates for draft products
    const templateDraftProducts = findDraftProductsInTemplates(productsData);
    
    // Print results
    printResults(blogDraftProducts, templateDraftProducts);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Load products data from CSV
function loadProductsData() {
  const productsCsvContent = fs.readFileSync(PRODUCTS_CSV_PATH, 'utf8');
  const products = parse(productsCsvContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true
  });
  
  // Create a map of handle to status for quick lookup
  const productsMap = {};
  products.forEach(product => {
    productsMap[product.Handle] = product.Status;
  });
  
  return productsMap;
}

// Find draft products referenced in blog posts
function findDraftProductsInBlogs(productsMap) {
  const blogPostsCsvContent = fs.readFileSync(BLOG_POSTS_CSV_PATH, 'utf8');
  const blogPosts = parse(blogPostsCsvContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true
  });
  
  const draftProductsInBlogs = [];
  
  blogPosts.forEach(blog => {
    const recipeItems = blog['Metafield: recipe.items [list.product_reference]'];
    
    if (recipeItems) {
      // Split the comma-separated list of product handles
      const productHandles = recipeItems.split(',').map(handle => handle.trim());
      
      // Check each product handle
      productHandles.forEach(handle => {
        if (productsMap[handle] === 'Draft') {
          draftProductsInBlogs.push({
            blogTitle: blog.Handle,
            productHandle: handle
          });
        }
      });
    }
  });
  
  return draftProductsInBlogs;
}

// Find draft products referenced in product templates
function findDraftProductsInTemplates(productsMap) {
  // Find all product template files
  const templatePath = path.join(path.dirname(__dirname), 'Theme', 'templates');
  
  const templateFiles = fs.readdirSync(templatePath)
    .filter(file => file.startsWith('product.') && file.endsWith('.json'))
    .map(file => path.join(templatePath, file));
  
  const draftProductsInTemplates = [];
  
  templateFiles.forEach(templateFile => {
    try {
      const templateContent = fs.readFileSync(templateFile, 'utf8');
      const templateData = JSON.parse(templateContent);
      
      // Extract product handles from settings
      const productHandles = extractProductHandlesFromTemplate(templateData);
      
      // Check each product handle
      productHandles.forEach(handle => {
        if (productsMap[handle] === 'Draft') {
          draftProductsInTemplates.push({
            templateFile: path.basename(templateFile),
            productHandle: handle
          });
        }
      });
    } catch (error) {
      console.error(`Error processing template file ${templateFile}:`, error.message);
    }
  });
  
  return draftProductsInTemplates;
}

// Extract product handles from template data
function extractProductHandlesFromTemplate(templateData) {
  const productHandles = new Set(); // Use Set to avoid duplicates
  
  // Function to recursively search for product handles in the template data
  function searchForProductHandles(obj) {
    if (!obj || typeof obj !== 'object') return;
    
    // Check all properties of the object
    for (const [key, value] of Object.entries(obj)) {
      // If we find a "product" property that's a string, add it
      if (key === 'product' && typeof value === 'string') {
        productHandles.add(value);
      }
      
      // If we find a "settings" object that has a "product" property
      if (key === 'settings' && value && typeof value === 'object' && value.product) {
        productHandles.add(value.product);
      }
      
      // Recursively search nested objects and arrays
      if (typeof value === 'object') {
        searchForProductHandles(value);
      }
    }
  }
  
  searchForProductHandles(templateData);
  return Array.from(productHandles);
}

// Print results
function printResults(blogDraftProducts, templateDraftProducts) {
  // Calculate total number of blogs and templates
  const totalBlogs = fs.readFileSync(BLOG_POSTS_CSV_PATH, 'utf8')
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('"ID"')) // Exclude header
    .length;
  
  const totalTemplates = fs.readdirSync(path.join(path.dirname(__dirname), 'Theme', 'templates'))
    .filter(file => file.startsWith('product.') && file.endsWith('.json'))
    .length;

  // Calculate percentages
  const blogsWithDrafts = new Set(blogDraftProducts.map(item => item.blogTitle)).size;
  const templatesWithDrafts = new Set(templateDraftProducts.map(item => item.templateFile)).size;
  
  const blogPercentage = ((blogsWithDrafts / totalBlogs) * 100).toFixed(1);
  const templatePercentage = ((templatesWithDrafts / totalTemplates) * 100).toFixed(1);

  // ANSI color codes
  const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
  };

  console.log(`\n${colors.bold}${colors.cyan}📊 DRAFT PRODUCT ANALYSIS | By: Cristobal A. | Hexclad | 2025${colors.reset}\n`);
  console.log(`${colors.yellow}🔍 Found ${colors.bold}${blogsWithDrafts}${colors.reset}${colors.yellow} Blogs with draft products, and ${colors.bold}${templatesWithDrafts}${colors.reset}${colors.yellow} Product Templates with draft products.${colors.reset}\n`);
  
  console.log(`${colors.bold}📈 Percentage Analysis:${colors.reset}`);
  console.log(`${colors.red}⚠️  ${blogPercentage}% of blogs have draft products (${blogsWithDrafts} out of ${totalBlogs} blogs)${colors.reset}`);
  console.log(`${colors.red}⚠️  ${templatePercentage}% of product templates have draft products (${templatesWithDrafts} out of ${totalTemplates} templates)${colors.reset}\n`);
  
  if (blogDraftProducts.length > 0) {
    console.log(`${colors.bold}${colors.blue}📝 Blog Titles with Draft products:${colors.reset}`);
    blogDraftProducts.forEach(item => {
      console.log(`${colors.yellow}  • Blog: ${colors.reset}${item.blogTitle}${colors.yellow}, Product: ${colors.reset}${item.productHandle}`);
    });
  }
  
  if (templateDraftProducts.length > 0) {
    console.log(`\n${colors.bold}${colors.blue}📋 Product Templates with Draft products:${colors.reset}`);
    templateDraftProducts.forEach(item => {
      console.log(`${colors.yellow}  • Template: ${colors.reset}${item.templateFile}${colors.yellow}, Product: ${colors.reset}${item.productHandle}`);
    });
  }
  console.log(`\n${colors.bold}${colors.green}✨ Analysis Complete${colors.reset}\n`);
}

// Run the main function
main();