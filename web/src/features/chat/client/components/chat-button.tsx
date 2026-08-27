"use client";

import { useChat } from "@ai-sdk/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { BillWithContent } from "@/features/bills/shared/types";
import { ChatWindow } from "./chat-window";

// アニメーション定数
const ANIMATION_DURATION = {
  SIZE_TRANSITION: 300, // ボタンサイズ変更のアニメーション時間（ms）
  // テキスト内容（文言・配置）の切り替えタイミング（サイズアニメーション終了間際）。
  // ラベルは常に表示したまま（opacityを0にしない）で内容だけを切り替えることで、
  // 遷移中に空のピルが見える状態を防ぐ。
  TEXT_CHANGE_DELAY: 250,
} as const;

interface ChatButtonProps {
  billContext?: BillWithContent;
  hasInterviewConfig?: boolean;
  difficultyLevel: string;
  pageContext?: {
    type: "home" | "bill";
    bills?: Array<{
      id: string;
      name: string;
      summary?: string;
      tags?: string[];
      isFeatured?: boolean;
    }>;
  };
}

export interface ChatButtonRef {
  openWithText: (selectedText: string) => void;
}

export const ChatButton = forwardRef<ChatButtonRef, ChatButtonProps>(
  ({ billContext, hasInterviewConfig, difficultyLevel, pageContext }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCompact, setIsCompact] = useState(false);
    // ラベルの文言・配置はサイズアニメーション終了間際に切り替える。
    // isCompact（ボックスサイズ）と切り離すことで、ラベルを常に表示したまま
    // （opacityを落とさずに）テキストだけを差し替えられるようにする。
    const [isLabelCompact, setIsLabelCompact] = useState(false);
    const [openedWithText, setOpenedWithText] = useState(false);
    const labelChangeTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
    const pathname = usePathname();

    // Chat state をここで管理することで、モーダルが閉じても状態が保持される
    const chatState = useChat();

    // pathname が変わるたびに新しいセッションIDを発行
    // ページ遷移時にチャットセッションをリセット
    // biome-ignore lint/correctness/useExhaustiveDependencies: pathnameが変わるたびに新しいIDを生成するため意図的に依存配列に含めている
    const sessionId = useMemo(() => crypto.randomUUID(), [pathname]);

    useImperativeHandle(ref, () => ({
      openWithText: (selectedText: string) => {
        // AIからの返答待ち中は新しいメッセージを送信しない
        if (
          chatState.status === "streaming" ||
          chatState.status === "submitted"
        ) {
          return;
        }

        const questionText = `「${selectedText}」について教えてください。`;
        setOpenedWithText(true);
        setIsOpen(true);
        chatState.sendMessage({
          text: questionText,
          metadata: {
            billContext,
            hasInterviewConfig,
            difficultyLevel,
            pageContext,
            sessionId,
          },
        });
      },
    }));

    useEffect(() => {
      let lastScrollY = window.scrollY;

      const handleScroll = () => {
        const currentScrollY = window.scrollY;
        const shouldCompact =
          currentScrollY > lastScrollY && currentScrollY > 0 && !isCompact;
        const shouldExpand = currentScrollY < lastScrollY && isCompact;

        if (shouldCompact || shouldExpand) {
          setIsCompact(shouldCompact);

          // 直前の切り替えタイマーが残っていると、古いタイマーが後から発火して
          // 最新の状態を上書きしてしまう（連続スクロールでの巻き戻り・チラつきの原因）。
          // 新しいタイマーを積む前に必ずクリアする。
          if (labelChangeTimeoutRef.current) {
            clearTimeout(labelChangeTimeoutRef.current);
          }
          labelChangeTimeoutRef.current = setTimeout(() => {
            setIsLabelCompact(shouldCompact);
            labelChangeTimeoutRef.current = null;
          }, ANIMATION_DURATION.TEXT_CHANGE_DELAY);
        }

        lastScrollY = currentScrollY;
      };

      window.addEventListener("scroll", handleScroll, { passive: true });

      return () => {
        window.removeEventListener("scroll", handleScroll);
        if (labelChangeTimeoutRef.current) {
          clearTimeout(labelChangeTimeoutRef.current);
        }
      };
    }, [isCompact]);

    return (
      <>
        {/* チャットを持つページのマーカー。globals.cssの
            `.main-column:has([data-chat-sidebar])` が検知して、静的HTMLでも
            チャットサイドバー用のレイアウト余白を適用する */}
        <span data-chat-sidebar className="hidden" />
        <div className="fixed max-w-[460px] mx-auto left-6 right-6 bottom-4 z-50 md:bottom-8 flex justify-center pc:hidden">
          {/* フローティングのAI質問ボタンは、タップ領域の識別性を優先して
              フラット基調の例外としてピル形状（rounded-[50px]）を維持している */}
          <div
            className="relative rounded-[50px] bg-primary p-[2px] shadow-md origin-center flex transition-[flex-basis] ease-in-out"
            style={{
              flexBasis: isCompact ? "120px" : "100%",
              transitionDuration: `${ANIMATION_DURATION.SIZE_TRANSITION}ms`,
            }}
          >
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className={`relative bg-white rounded-[50px] hover:opacity-90 flex items-center w-full py-2 overflow-hidden transition-all ease-in-out ${
                isCompact
                  ? "h-[35px] px-4 justify-center gap-2.5"
                  : "h-14 justify-end pr-4 pl-6 gap-2.5"
              }`}
              style={{
                transitionDuration: `${ANIMATION_DURATION.SIZE_TRANSITION}ms`,
              }}
              aria-label="議案について質問する"
            >
              <span
                className={`text-mirai-text-placeholder text-sm font-medium leading-[1.5em] tracking-[0.01em] whitespace-nowrap ${
                  isLabelCompact ? "text-center" : "flex-1 text-left"
                }`}
              >
                {isLabelCompact ? "AIに質問" : "わからないことをAIに質問する"}
              </span>
              {!isCompact && (
                <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <Image
                    src="/icons/chat-button-icon.svg"
                    alt="チャット"
                    width={40}
                    height={40}
                    className="pointer-events-none"
                  />
                </div>
              )}
            </button>
          </div>
        </div>

        <ChatWindow
          billContext={billContext}
          hasInterviewConfig={hasInterviewConfig}
          difficultyLevel={difficultyLevel}
          chatState={chatState}
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            setOpenedWithText(false);
          }}
          pageContext={pageContext}
          disableAutoFocus={openedWithText}
          sessionId={sessionId}
        />
      </>
    );
  }
);

ChatButton.displayName = "ChatButton";
