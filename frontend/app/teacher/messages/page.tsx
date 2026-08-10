'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Paperclip, Send } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useTeacherMessagesStore, type Conversation, type ChatMessage } from '@/lib/store/teacher-messages-store';
import { cn } from '@/lib/utils';
import { formatLocalizedDate, INTL_DATE_LOCALES } from '@/i18n/date-locale';
import { isLocale, DEFAULT_LOCALE, type Locale } from '@/i18n/locales';

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = ChatMessage;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string, locale: Locale) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString(INTL_DATE_LOCALES[locale], { hour: 'numeric', minute: '2-digit', hour12: locale === 'en' });
  }
  return formatLocalizedDate(d, locale, { month: 'short', day: 'numeric' });
}

function formatMessageTime(iso: string, locale: Locale) {
  return new Date(iso).toLocaleTimeString(INTL_DATE_LOCALES[locale], { hour: 'numeric', minute: '2-digit', hour12: locale === 'en' });
}

function getRoleVariant(role: Conversation['participantRole']): 'info' | 'warning' | 'purple' {
  if (role === 'student') return 'purple';
  if (role === 'admin') return 'warning';
  return 'info'; // parent
}

// t is TeacherMessages's useTranslations return value.
function getRoleLabel(role: Conversation['participantRole'], t: ReturnType<typeof useTranslations<'TeacherMessages'>>) {
  if (role === 'student') return t('roleStudent');
  if (role === 'admin') return t('roleAdmin');
  return t('roleParent');
}

// ─── Conversation Item ────────────────────────────────────────────────────────

function ConversationItem({
  conv,
  isActive,
  onClick,
}: {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const t = useTranslations('TeacherMessages');
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left flex items-start gap-3 px-4 py-3.5 transition-colors border-r-2',
        isActive
          ? 'bg-indigo-50 border-indigo-500'
          : 'border-transparent hover:bg-slate-50'
      )}
    >
      <Avatar name={conv.participantName} size="md" className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className={cn(
              'text-sm truncate mr-2',
              conv.unread > 0 ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
            )}
          >
            {conv.participantName}
          </span>
          <span className="text-xs text-slate-400 flex-shrink-0">{formatTime(conv.lastTime, locale)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            label={getRoleLabel(conv.participantRole, t)}
            variant={getRoleVariant(conv.participantRole)}
            className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0"
          />
        </div>
        <p className="text-xs text-slate-400 truncate mt-0.5">{conv.lastMessage}</p>
      </div>
      {conv.unread > 0 && (
        <span className="flex-shrink-0 mt-1 h-5 min-w-[20px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
          {conv.unread}
        </span>
      )}
    </button>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  if (message.isMe) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-xs lg:max-w-md">
          <p className="text-sm leading-relaxed">{message.text}</p>
        </div>
        <span className="text-xs text-slate-400">{formatMessageTime(message.time, locale)}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-2 max-w-xs lg:max-w-md">
        <p className="text-sm text-slate-800 leading-relaxed">{message.text}</p>
      </div>
      <span className="text-xs text-slate-400">{formatMessageTime(message.time, locale)}</span>
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function MessagesPage() {
  const t = useTranslations('TeacherMessages');
  const conversations = useTeacherMessagesStore((s) => s.conversations);
  const sendMessage = useTeacherMessagesStore((s) => s.sendMessage);

  const [convSearch, setConvSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((m) => m.id === activeId) ?? null;

  const filteredConvs = conversations.filter((c) =>
    !convSearch ||
    c.participantName.toLowerCase().includes(convSearch.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(convSearch.toLowerCase())
  );

  // Scroll to bottom when conversation changes or new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, activeConv?.messages.length]);

  const handleSend = () => {
    if (!inputText.trim() || !activeId) return;
    sendMessage(activeId, inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
      />

      {/* Two-panel layout */}
      <div
        className="bg-white rounded-2xl shadow-sm border border-slate-100 flex overflow-hidden"
        style={{ height: 'calc(100vh - 160px)' }}
      >
        {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
        <div className="w-80 flex-shrink-0 border-r border-slate-100 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-slate-50">
            <Input
              placeholder={t('searchConversationsPlaceholder')}
              value={convSearch}
              onChange={(e) => setConvSearch(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                <MessageSquare className="h-8 w-8" />
                <p className="text-sm">{t('noConversationsFound')}</p>
              </div>
            ) : (
              filteredConvs.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === activeId}
                  onClick={() => setActiveId(conv.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeConv === null ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center flex-1 gap-4 text-slate-400">
              <div className="p-5 bg-slate-100 rounded-2xl">
                <MessageSquare className="h-10 w-10 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="text-base font-medium text-slate-600">{t('selectConversationTitle')}</p>
                <p className="text-sm mt-1">{t('selectConversationHint')}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Conversation header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-white flex-shrink-0">
                <div className="relative">
                  <Avatar name={activeConv.participantName} size="md" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{activeConv.participantName}</span>
                    <Badge
                      label={getRoleLabel(activeConv.participantRole, t)}
                      variant={getRoleVariant(activeConv.participantRole)}
                    />
                  </div>
                  <p className="text-xs text-emerald-500 font-medium">{t('onlineStatus')}</p>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50/50">
                {activeConv.messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="px-4 py-3 border-t border-slate-100 bg-white flex items-center gap-2 flex-shrink-0">
                <div className="flex-1">
                  <Input
                    placeholder={t('typeMessagePlaceholder')}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full"
                  />
                </div>
                <button
                  className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title={t('attachFileTitle')}
                  type="button"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
