# Draft Product Finder

A Node.js tool to identify products in draft status across your Shopify theme store.

## Overview

This tool scans your Shopify theme files to find products that are in "Draft" status but are referenced in:

1. Blog posts (in the recipe items metafield)
2. Product templates (in the settings)

This helps identify draft products that are still being referenced in your live content, which could lead to broken links or missing products for customers.

## Requirements

- Node.js (v12 or higher)
- npm

## Installation

1. Clone this repository or download the files
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

## Usage

1. Make sure your CSV files and theme files are in the correct locations relative to the script:
   - `../Products.csv` - Contains product data with Handle and Status columns
   - `../Blog Posts.csv` - Contains blog post data with Metafield: recipe.items [list.product_reference]
   - `../Theme/templates/` - Contains product template JSON files

2. Run the script:

```bash
node index.js
```

3. The script will output:
   - Number of draft products found in blogs
   - Number of draft products found in product templates
   - List of blog titles with draft products
   - List of product templates with draft products

## CSV File Format

For best results, use Matrixify to export your data from Shopify. The CSV files should have the following format:

### Products.csv
```
"ID","Handle","Status","Variant ID"
"8702334075212","hexclad-6pc-hexclad-pot-set","Draft","47124069450060"
```

### Blog Posts.csv
```
"ID","Handle","Published","Metafield: recipe.items [list.product_reference]"
"559717613739","how-to-cut-a-dragon-fruit-5-serving-ideas","true",""
```

## Configuration

You can modify the file paths in the `index.js` file if your files are located elsewhere:

```javascript
const PRODUCTS_CSV_PATH = '../Products.csv';
const BLOG_POSTS_CSV_PATH = '../Blog Posts.csv';
const THEME_TEMPLATES_PATH = '../Theme/templates';
```

## Troubleshooting

If you encounter issues with the script:

1. Make sure your CSV files are properly formatted with UTF-8 encoding
2. Verify that the file paths are correct relative to where you're running the script
3. Check that your product templates are in JSON format and contain product references

## License

ISC 