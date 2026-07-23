// @ts-nocheck
import { useState } from "react";
import { useLocation } from "react-router-dom";
import FounderLayout from "@/components/layout/FounderLayout";
import TalentLayout from "@/components/layout/TalentLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MoreVertical, Paperclip, Smile, Mic, Send, Phone, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useDatabaseStore } from "@/store/useDatabaseStore";

export default function Messages() {
  const location = useLocation();
  const isFounder = location.pathname.startsWith('/founder');
  const Layout = isFounder ? FounderLayout : TalentLayout;

  const { chats, messages, sendMessage } = useDatabaseStore();
  const [message, setMessage] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const activeMessages = activeChat ? messages.filter(m => m.chatId === activeChat.id) : [];

  const handleSend = () => {
    if (message.trim() && activeChat) {
      const senderName = isFounder ? activeChat.founderName : activeChat.talentName;
      sendMessage(activeChat.id, senderName, isFounder ? 'founder' : 'talent', message);
      setMessage("");
    }
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-1px)]">
        {/* Left Sidebar - Chat List */}
        <div className="w-80 border-r flex flex-col bg-background/50">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search messages..." className="pl-9 bg-muted/50" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {chats.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No active chats. Accept an application first!</div>
              ) : (
                chats.map(chat => (
                  <div 
                    key={chat.id} 
                    onClick={() => setActiveChatId(chat.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeChat?.id === chat.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={isFounder ? chat.talentAvatar : `https://api.dicebear.com/7.x/shapes/svg?seed=${chat.startupName}`} />
                        <AvatarFallback>{(isFounder ? chat.talentName : chat.startupName).charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm truncate">{isFounder ? chat.talentName : chat.startupName}</h4>
                        <span className="text-xs text-muted-foreground">{chat.lastMessageTime}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Area - Chat Window */}
        <div className="flex-1 flex flex-col bg-background">
          {/* Chat Header */}
          {activeChat ? (
            <>
              <div className="h-16 border-b flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={isFounder ? activeChat.talentAvatar : `https://api.dicebear.com/7.x/shapes/svg?seed=${activeChat.startupName}`} />
                    <AvatarFallback>{(isFounder ? activeChat.talentName : activeChat.startupName).charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-sm">{isFounder ? activeChat.talentName : activeChat.startupName}</h3>
                    <p className="text-xs text-green-500">Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Button variant="ghost" size="icon"><Phone className="w-5 h-5" /></Button>
                  <Button variant="ghost" size="icon"><Video className="w-5 h-5" /></Button>
                  <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5" /></Button>
                </div>
              </div>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {activeMessages.map(msg => {
                    const isMe = (isFounder && msg.senderRole === 'founder') || (!isFounder && msg.senderRole === 'talent');
                    return (
                      <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>{isMe ? 'ME' : msg.senderName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className={`p-3 rounded-2xl text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted text-foreground rounded-tl-none'}`}>
                            {msg.text}
                          </div>
                          <p className={`text-xs text-muted-foreground mt-1 ${isMe ? 'text-right' : 'text-left'}`}>{msg.timestamp}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a chat to start messaging
            </div>
          )}

          {/* Chat Input */}
          <div className="p-4 border-t bg-background">
            <div className="flex items-end gap-2 bg-muted/30 border rounded-xl p-2 focus-within:ring-1 focus-within:ring-primary transition-all">
              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground"><Paperclip className="w-5 h-5" /></Button>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 max-h-32 min-h-10 bg-transparent resize-none border-0 focus:ring-0 text-sm py-2 outline-none"
                rows={1}
                disabled={!activeChat}
              />
              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground"><Smile className="w-5 h-5" /></Button>
              {message.trim() ? (
                <Button size="icon" onClick={handleSend} className="shrink-0 rounded-full w-10 h-10"><Send className="w-4 h-4" /></Button>
              ) : (
                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground"><Mic className="w-5 h-5" /></Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
