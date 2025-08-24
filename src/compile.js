// src/compile.js
const fs = require('fs');
const path = require('path');
const marked = require('marked');

// 定义路径
const markdownDir = path.join(__dirname, '../markdown');
const htmlTemplateDir = path.join(__dirname, '../html');
const publicDir = path.join(__dirname, '../public');

// 确保 public 目录存在
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// 读取 HTML 模板
function readTemplate(templatePath) {
    try {
        return fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
        console.error(`Error reading template file: ${templatePath}`, error);
        return null;
    }
}

// 读取 Markdown 文件并转换为 HTML
function convertMarkdownToHtml(markdownPath) {
    try {
        const markdownContent = fs.readFileSync(markdownPath, 'utf8');
        return marked.parse(markdownContent); // 使用 marked 解析 Markdown
    } catch (error) {
        console.error(`Error reading or converting Markdown file: ${markdownPath}`, error);
        return null;
    }
}

// 生成最终的 HTML 文件
function generateHtmlFile(template, content, outputPath) {
    try {
        const finalHtml = template.replace('${content}', content);
        fs.writeFileSync(outputPath, finalHtml, 'utf8');
        console.log(`Generated: ${outputPath}`);
    } catch (error) {
        console.error(`Error writing HTML file: ${outputPath}`, error);
    }
}

// 主函数：遍历 markdown 目录，处理每个 .md 文件
function compileMarkdown() {
    fs.readdir(markdownDir, (err, files) => {
        if (err) {
            console.error('Error reading markdown directory:', err);
            return;
        }

        files.forEach(file => {
            if (path.extname(file) === '.md') {
                const markdownPath = path.join(markdownDir, file);
                const fileNameWithoutExt = path.basename(file, '.md');
                const templatePath = path.join(htmlTemplateDir, `${fileNameWithoutExt}.html`);
                const outputPath = path.join(publicDir, `${fileNameWithoutExt}.html`);

                // 读取模板
                const template = readTemplate(templatePath);
                if (!template) {
                    console.warn(`Template not found for ${file}, skipping...`);
                    return;
                }

                // 转换 Markdown 为 HTML
                const htmlContent = convertMarkdownToHtml(markdownPath);
                if (!htmlContent) {
                    console.warn(`Failed to convert ${file}, skipping...`);
                    return;
                }

                // 生成最终的 HTML 文件
                generateHtmlFile(template, htmlContent, outputPath);
            }
        });
    });
}

// 执行编译
compileMarkdown();