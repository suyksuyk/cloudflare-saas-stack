#!/usr/bin/env node

/**
 * Google OAuth 配置测试脚本
 * 用于验证环境变量和配置是否正确
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// 简单的环境变量加载函数
function loadEnvFile(filePath: string) {
  try {
    const content = readFileSync(filePath, "utf-8");
    content.split("\n").forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").replace(/^["']|["']$/g, "");
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    // 文件不存在，忽略
  }
}

// 加载环境变量
loadEnvFile(resolve(".env.local"));
loadEnvFile(resolve(".env"));

interface TestResult {
  success: boolean;
  message: string;
  details?: string;
}

function testEnvironmentVariable(name: string, required: boolean = true): TestResult {
  const value = process.env[name];
  
  if (!value) {
    if (required) {
      return {
        success: false,
        message: `❌ 缺少必需的环境变量: ${name}`,
        details: `请在 .env.local 文件中设置 ${name}`
      };
    } else {
      return {
        success: true,
        message: `⚠️  可选环境变量未设置: ${name}`,
        details: "这是可选的，不影响基本功能"
      };
    }
  }

  return {
    success: true,
    message: `✅ 环境变量已设置: ${name}`,
    details: `值长度: ${value.length} 字符`
  };
}

function testGoogleOAuthConfig(): TestResult {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return {
      success: false,
      message: "❌ Google OAuth 配置不完整",
      details: "需要设置 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET"
    };
  }

  // 检查客户端ID格式
  if (!clientId.match(/^[0-9]+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/)) {
    return {
      success: false,
      message: "❌ Google Client ID 格式不正确",
      details: "应该类似于: 123456789-abcdef.apps.googleusercontent.com"
    };
  }

  // 检查客户端密钥长度
  if (clientSecret.length < 10) {
    return {
      success: false,
      message: "❌ Google Client Secret 长度不够",
      details: "客户端密钥应该更长"
    };
  }

  return {
    success: true,
    message: "✅ Google OAuth 配置正确",
    details: "客户端ID和密钥格式验证通过"
  };
}

function testNextAuthConfig(): TestResult {
  const secret = process.env.NEXTAUTH_SECRET;
  const url = process.env.NEXTAUTH_URL;
  
  if (!secret) {
    return {
      success: false,
      message: "❌ 缺少 NextAuth Secret",
      details: "请运行: openssl rand -base64 32 生成密钥"
    };
  }

  if (secret.length < 32) {
    return {
      success: false,
      message: "❌ NextAuth Secret 长度不够",
      details: "密钥长度应该至少32个字符"
    };
  }

  if (!url) {
    return {
      success: false,
      message: "❌ 缺少 NEXTAUTH_URL",
      details: "请设置正确的回调URL"
    };
  }

  return {
    success: true,
    message: "✅ NextAuth 配置正确",
    details: `URL: ${url}`
  };
}

function testDatabaseConfig(): TestResult {
  const database = process.env.DATABASE;
  const accountId = process.env.CLOUDFLARE_D1_ACCOUNT_ID;
  
  if (!database) {
    return {
      success: false,
      message: "❌ 缺少数据库配置",
      details: "需要设置 DATABASE 环境变量"
    };
  }

  return {
    success: true,
    message: "✅ 数据库配置已设置",
    details: accountId ? `账户ID: ${accountId}` : "未设置账户ID"
  };
}

async function runTests() {
  console.log("🔍 开始测试 Google OAuth 配置...\n");

  const tests = [
    { name: "Google Client ID", fn: () => testEnvironmentVariable("GOOGLE_CLIENT_ID") },
    { name: "Google Client Secret", fn: () => testEnvironmentVariable("GOOGLE_CLIENT_SECRET") },
    { name: "NextAuth Secret", fn: () => testEnvironmentVariable("NEXTAUTH_SECRET") },
    { name: "NextAuth URL", fn: () => testEnvironmentVariable("NEXTAUTH_URL") },
    { name: "Google OAuth 配置", fn: testGoogleOAuthConfig },
    { name: "NextAuth 配置", fn: testNextAuthConfig },
    { name: "数据库配置", fn: testDatabaseConfig },
    { name: "允许的域名", fn: () => testEnvironmentVariable("ALLOWED_DOMAINS", false) },
    { name: "Mock 模式", fn: () => testEnvironmentVariable("USE_MOCK_AUTH", false) },
  ];

  let allPassed = true;

  for (const test of tests) {
    try {
      const result = test.fn();
      console.log(`${result.message}`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
      console.log();
      
      if (!result.success) {
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ 测试 ${test.name} 失败: ${error}\n`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log("🎉 所有测试通过！Google OAuth 配置正确。\n");
    console.log("📋 下一步操作:");
    console.log("1. 确保在 Google Cloud Console 中设置了正确的回调URL");
    console.log("2. 运行 `npm run dev` 启动开发服务器");
    console.log("3. 访问 http://localhost:3000/auth/signin 测试登录");
  } else {
    console.log("❌ 部分测试失败，请修复上述问题后重试。\n");
    console.log("📖 帮助文档:");
    console.log("- 查看 GOOGLE_OAUTH设置指南.md");
    console.log("- 检查 .env.example 文件中的配置说明");
  }

  process.exit(allPassed ? 0 : 1);
}

// 运行测试
runTests().catch(console.error);
