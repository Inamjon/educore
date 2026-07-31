import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TEACHER_MESSAGES } from "@/lib/teacher-data";

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  time: string;
  isMe: boolean;
}

export interface Conversation {
  id: string;
  participantName: string;
  participantRole: "student" | "parent" | "admin";
  lastMessage: string;
  lastTime: string;
  unread: number;
  avatar?: string;
  messages: ChatMessage[];
}

interface TeacherMessagesState {
  conversations: Conversation[];
  sendMessage: (conversationId: string, text: string) => void;
}

export const useTeacherMessagesStore = create<TeacherMessagesState>()(
  persist(
    (set) => ({
      conversations: TEACHER_MESSAGES as Conversation[],

      sendMessage: (conversationId, text) =>
        set((s) => {
          const now = new Date().toISOString();
          const message: ChatMessage = {
            id: `m${Date.now()}`,
            senderId: "t1",
            text,
            time: now,
            isMe: true,
          };
          return {
            conversations: s.conversations.map((c) =>
              c.id === conversationId
                ? { ...c, messages: [...c.messages, message], lastMessage: text, lastTime: now }
                : c
            ),
          };
        }),
    }),
    { name: "educore-teacher-messages", version: 1 }
  )
);
