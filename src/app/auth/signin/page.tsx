import { SignInButton } from "@/components/auth/signin-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            登录您的账户
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            使用您的 Google 账户快速登录
          </p>
        </div>
        
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">欢迎回来</CardTitle>
            <CardDescription className="text-center">
              选择您喜欢的登录方式
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <SignInButton />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    或者
                  </span>
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-600">
                <p>
                  登录即表示您同意我们的{" "}
                  <a href="/terms" className="text-blue-600 hover:underline">
                    服务条款
                  </a>{" "}
                  和{" "}
                  <a href="/privacy" className="text-blue-600 hover:underline">
                    隐私政策
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            还没有账户？{" "}
            <a href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              立即注册
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
