// src/components/ui/progress.tsx (ファイル名を確認してください)

"use client" // Next.js App Router を使用している場合は必要

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils" // cn関数が正しくインポートされているか確認

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    // shadcn/ui のデフォルトスタイルに合わせて調整 (h-4, bg-secondary)
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all duration-300 ease-in-out" // アニメーションを追加 (任意)
      // value が null または undefined の場合は 0 を使用する
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
)) // ここで forwardRef のコールバック関数が終わる
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }