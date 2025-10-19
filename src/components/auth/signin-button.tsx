"use client";

import { signIn, SignInResponse } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  AuthProvider, 
  AuthErrorCode, 
  AUTH_ERROR_MESSAGES 
} from "@/types/auth";

interface SignInButtonProps {
  callbackUrl?: string;
  className?: string;
  provider?: AuthProvider;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  onError?: (error: string) => void;
  onSuccess?: () => void;
}

// 获取错误消息
function getErrorMessage(error?: string): string {
  if (!error) return AUTH_ERROR_MESSAGES[AuthErrorCode.DEFAULT];
  
  // 尝试映射到已知的错误代码
  const errorCode = Object.values(AuthErrorCode).find(code => code === error);
  if (errorCode) {
    return AUTH_ERROR_MESSAGES[errorCode];
  }
  
  return AUTH_ERROR_MESSAGES[AuthErrorCode.DEFAULT];
}

// 处理登录结果
async function handleSignInResult(
  result: SignInResponse | undefined,
  provider: AuthProvider,
  callbackUrl: string,
  onError?: (error: string) => void,
  onSuccess?: () => void
): Promise<void> {
  if (result?.error) {
    const errorMessage = getErrorMessage(result.error);
    onError?.(errorMessage);
    console.error(`${provider} sign in error:`, result.error);
  } else if (result?.ok) {
    onSuccess?.();
    // 手动重定向以避免某些浏览器阻止弹窗
    window.location.href = callbackUrl;
  }
}

// Google图标组件
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// 加载指示器组件
const LoadingSpinner = () => (
  <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
);

export function SignInButton({ 
  callbackUrl = "/", 
  className,
  provider = "google",
  variant = "outline",
  size = "default",
  onError,
  onSuccess
}: SignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoading(true);
    setInternalError(null);
    
    try {
      const result = await signIn(provider, {
        callbackUrl,
        redirect: false,
      });
      
      await handleSignInResult(
        result,
        provider,
        callbackUrl,
        (error) => {
          setInternalError(error);
          onError?.(error);
        },
        onSuccess
      );
    } catch (err) {
      const networkError = AUTH_ERROR_MESSAGES[AuthErrorCode.NETWORK_ERROR];
      setInternalError(networkError);
      onError?.(networkError);
      console.error("Sign in error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = (): string => {
    if (isLoading) return "正在登录...";
    if (provider === "google") return "使用 Google 登录";
    if (provider === "mock") return "使用测试账户登录";
    return "登录";
  };

  const getIcon = () => {
    if (isLoading) return <LoadingSpinner />;
    if (provider === "google") return <GoogleIcon />;
    return null;
  };

  const displayError = internalError;

  return (
    <div className="space-y-2">
      <Button
        onClick={handleSignIn}
        variant={variant}
        size={size}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-3 h-11 ${className}`}
        aria-label={`使用 ${provider} 登录`}
      >
        {getIcon()}
        {getButtonText()}
      </Button>
      
      {displayError && (
        <div 
          className="text-sm text-red-600 text-center bg-red-50 p-2 rounded-md border border-red-200"
          role="alert"
          aria-live="polite"
        >
          {displayError}
        </div>
      )}
    </div>
  );
}
