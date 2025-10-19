"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, Settings, Loader2 } from "lucide-react";

interface UserInfoProps {
  showProfileLink?: boolean;
  showSettingsLink?: boolean;
  onSignOut?: () => void;
}

// 生成用户头像缩写
function generateUserInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  
  return "U";
}

// 安全的导航函数
function safeNavigate(href: string) {
  try {
    window.location.href = href;
  } catch (error) {
    console.error("导航失败:", error);
  }
}

export function UserInfo({ 
  showProfileLink = true, 
  showSettingsLink = true,
  onSignOut 
}: UserInfoProps) {
  const { data: session, status } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // 加载状态
  if (status === "loading") {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  // 未登录状态
  if (!session?.user) {
    return null;
  }

  const userInitials = generateUserInitials(session.user.name, session.user.email);

  // 处理登出
  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    
    try {
      await signOut({ callbackUrl: "/" });
      onSignOut?.();
    } catch (error) {
      console.error("登出失败:", error);
      // 即使出错也尝试重定向
      safeNavigate("/");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full hover:bg-accent transition-colors"
          aria-label="用户菜单"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={session.user.image || ""}
              alt={session.user.name || session.user.email || "用户头像"}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {/* 用户信息头部 */}
        <div className="flex items-center gap-3 p-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={session.user.image || ""}
              alt={session.user.name || session.user.email || "用户头像"}
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 min-w-0">
            {session.user.name && (
              <p className="font-medium text-sm truncate">
                {session.user.name}
              </p>
            )}
            {session.user.email && (
              <p className="text-xs text-muted-foreground truncate" title={session.user.email}>
                {session.user.email}
              </p>
            )}
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* 菜单项 */}
        {showProfileLink && (
          <DropdownMenuItem asChild>
            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-2"
              onClick={() => safeNavigate("/profile")}
            >
              <User className="mr-2 h-4 w-4" />
              个人资料
            </Button>
          </DropdownMenuItem>
        )}
        
        {showSettingsLink && (
          <DropdownMenuItem asChild>
            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-2"
              onClick={() => safeNavigate("/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              设置
            </Button>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {/* 登出按钮 */}
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            className="w-full justify-start h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            {isSigningOut ? "正在退出..." : "退出登录"}
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
