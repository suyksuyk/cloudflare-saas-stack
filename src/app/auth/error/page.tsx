import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-500">
            <AlertCircle className="h-full w-full" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            认证失败
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            登录过程中发生了错误，请重试
          </p>
        </div>
        
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">登录错误</CardTitle>
            <CardDescription className="text-center">
              可能的原因和解决方案
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">常见问题：</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Google OAuth 配置错误</li>
                  <li>邮箱域名不在允许列表中</li>
                  <li>网络连接问题</li>
                  <li>浏览器阻止了第三方Cookie</li>
                </ul>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-1">解决方法：</h4>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>检查网络连接</li>
                  <li>清除浏览器缓存和Cookie</li>
                  <li>使用无痕模式重试</li>
                  <li>联系管理员获取帮助</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-2 pt-4">
              <Button asChild className="w-full">
                <Link href="/auth/signin">
                  重新登录
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  返回首页
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            如果问题持续存在，请联系技术支持
          </p>
        </div>
      </div>
    </div>
  );
}
