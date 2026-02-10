import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getChatHistory, clearChatHistory } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { ChatMessage } from '@/types';
import { Send, Bot, User, AlertCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Chat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [clearing, setClearing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const loadHistory = async () => {
      try {
        const history = await getChatHistory(user.id);
        setMessages(history);
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  const handleSend = async () => {
    if (!input.trim() || !user || sending) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);
    setStreamingMessage('');

    // Add user message to UI
    const tempUserMessage: ChatMessage = {
      id: Date.now().toString(),
      user_id: user.id,
      role: 'user',
      message: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          message: userMessage,
          userId: user.id
        }
      });

      if (error) {
        throw error;
      }

      // Handle streaming response
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            message: userMessage,
            userId: user.id
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data.trim()) {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.text) {
                    fullResponse += parsed.text;
                    setStreamingMessage(fullResponse);
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        }
      }

      // Add model response to messages
      const modelMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        user_id: user.id,
        role: 'model',
        message: fullResponse,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, modelMessage]);
      setStreamingMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        user_id: user.id,
        role: 'model',
        message: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = async () => {
    if (!user || clearing) return;
    
    setClearing(true);
    try {
      await clearChatHistory(user.id);
      setMessages([]);
      toast({
        title: 'Chat cleared',
        description: 'All chat history has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear chat history. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64 bg-muted" />
        <Skeleton className="h-96 bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] lg:h-[calc(100vh-4rem)]">
      <div className="p-4 md:p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">AI Finance Assistant</h1>
          <p className="text-sm md:text-base text-muted-foreground">Ask me anything about your finances</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 rounded-full"
              disabled={messages.length === 0 || clearing}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear Chat</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your chat messages and conversation history. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Alert className="m-4 md:m-6 mb-0">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          This assistant provides budgeting insights only and does not offer investment or legal advice.
        </AlertDescription>
      </Alert>

      <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
        <div className="space-y-4 max-w-3xl mx-auto pb-4">
          {messages.length === 0 && (
            <Card className="p-6 text-center floating-card">
              <Bot className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Welcome to your Finance Assistant</h3>
              <p className="text-muted-foreground text-sm">
                Ask me about your spending, budget, or financial goals. I'm here to help!
              </p>
            </Card>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 md:gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <div
                className={`rounded-2xl p-3 md:p-4 max-w-[85%] md:max-w-[80%] ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg'
                    : 'bg-muted shadow-md'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm md:text-base">{msg.message}</p>
              </div>
              {msg.role === 'user' && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}

          {streamingMessage && (
            <div className="flex gap-2 md:gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="rounded-2xl p-3 md:p-4 max-w-[85%] md:max-w-[80%] bg-muted shadow-md">
                <p className="whitespace-pre-wrap text-sm md:text-base">{streamingMessage}</p>
              </div>
            </div>
          )}

          {sending && !streamingMessage && (
            <div className="flex gap-2 md:gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="rounded-2xl p-3 md:p-4 bg-muted shadow-md">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-foreground animate-bounce" />
                  <div className="h-2 w-2 rounded-full bg-foreground animate-bounce delay-100" />
                  <div className="h-2 w-2 rounded-full bg-foreground animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 md:p-6 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-20 lg:pb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 max-w-3xl mx-auto"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your finances..."
            disabled={sending}
            className="flex-1 rounded-full"
          />
          <Button type="submit" disabled={sending || !input.trim()} className="rounded-full" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
