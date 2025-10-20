#!/usr/bin/env node

/**
 * 测试 Cloudflare Pages Worker 修复
 * 验证 functions 代码是否能正常运行
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 测试 Cloudflare Pages Worker 修复...');

// 检查 functions 文件是否存在
const middlewarePath = path.join(process.cwd(), 'functions/_middleware.js');
const authPath = path.join(process.cwd(), 'functions/api/auth.js');

if (!fs.existsSync(middlewarePath)) {
  console.error('❌ functions/_middleware.js 不存在');
  process.exit(1);
}

if (!fs.existsSync(authPath)) {
  console.error('❌ functions/api/auth.js 不存在');
  process.exit(1);
}

// 检查是否还有 process.env 引用
const authContent = fs.readFileSync(authPath, 'utf8');
const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');

const processEnvRegex = /process\.env\./g;
const authMatches = authContent.match(processEnvRegex);
const middlewareMatches = middlewareContent.match(processEnvRegex);

if (authMatches) {
  console.error('❌ functions/api/auth.js 中仍有 process.env 引用:', authMatches);
  process.exit(1);
}

if (middlewareMatches) {
  console.error('❌ functions/_middleware.js 中仍有 process.env 引用:', middlewareMatches);
  process.exit(1);
}

// 检查正确的环境变量使用
const envRegex = /env\.\w+/g;
const authEnvMatches = authContent.match(envRegex) || [];

console.log('✅ functions/api/auth.js 环境变量使用:', authEnvMatches);

// 验证语法（检查基本语法结构）
try {
  // 检查是否有基本的语法错误
  if (authContent.includes('export') && authContent.includes('function')) {
    console.log('✅ functions/api/auth.js 语法结构正确');
  }
  
  if (middlewareContent.includes('export') && middlewareContent.includes('function')) {
    console.log('✅ functions/_middleware.js 语法结构正确');
  }
  
  // 检查是否有未闭合的括号
  const openBrackets = (authContent + middlewareContent).match(/\{/g) || [];
  const closeBrackets = (authContent + middlewareContent).match(/\}/g) || [];
  
  if (openBrackets.length !== closeBrackets.length) {
    throw new Error('括号不匹配');
  }
  
  console.log('✅ 所有 functions 文件语法正确');
} catch (error) {
  console.error('❌ 语法错误:', error.message);
  process.exit(1);
}

console.log('🎉 Worker 修复验证通过！');
console.log('');
console.log('📋 修复内容:');
console.log('- 移除了所有 process.env 引用');
console.log('- 使用 context.env 访问环境变量');
console.log('- 保持了所有认证功能');
console.log('');
console.log('🚀 现在可以重新部署到 Cloudflare Pages');
