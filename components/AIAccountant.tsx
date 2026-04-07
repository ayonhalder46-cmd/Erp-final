import React, { useState, useRef, useEffect } from 'react';
import { Sale, Expense, Return, PurchaseOrder } from '../types';
import { getAccountantChatResponseStream } from '../services/geminiService';
import { Send, Sparkles, BrainCircuit, User, Bot, Calculator } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAccountantProps {
  sales: Sale[];
  expenses: Expense[];
  returns: Return[];
  purchaseOrders: PurchaseOrder[];
  isActive: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIAccountant: React.FC<AIAccountantProps> = ({ sales, expenses, returns, purchaseOrders, isActive }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I am your Senior AI Accountant. I have access to your sales, expenses, returns, and purchase orders. How can I assist you with your finances today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && isActive) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isActive]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    
    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }]);

    try {
      const responseStream = await getAccountantChatResponseStream(input, sales, expenses, returns, purchaseOrders);
      
      for await (const chunk of responseStream) {
        if (chunk.text) {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: msg.content + chunk.text }
              : msg
          ));
        }
      }
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: "I'm currently unable to access my accounting models. Please ensure your system state is synchronized and try again." }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100dvh-96px)] md:h-[calc(100dvh-64px)] flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-800 dark:text-white">AI Accountant</h2>
          <p className="text-slate-500 dark:text-slate-400">Your dedicated financial assistant and bookkeeper.</p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
          <Calculator className="text-emerald-600 dark:text-emerald-400" size={20} />
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-widest">Financial Model Active</span>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        
        {/* Chat History */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth relative z-10 custom-scrollbar"
        >
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-slate-800 dark:bg-slate-700 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`max-w-[80%] p-5 rounded-[1.5rem] shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700'
              }`}>
                <div className="text-sm leading-relaxed markdown-body">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                <p className={`text-[10px] mt-2 opacity-60 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                <Bot size={20} className="text-slate-400" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800/50 h-16 w-48 rounded-[1.5rem] rounded-tl-none"></div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {messages.length === 1 && (
          <div className="px-8 pb-4 relative z-10 flex flex-wrap gap-2">
            <button 
              onClick={() => { setInput("Generate a comprehensive Profit & Loss (P&L) summary for the recent period."); }}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-full hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-900/20 transition-colors text-slate-700 dark:text-slate-300"
            >
              📊 Generate P&L Summary
            </button>
            <button 
              onClick={() => { setInput("Analyze my cash flow based on recent sales, expenses, and purchase orders. Are there any liquidity risks?"); }}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-full hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-900/20 transition-colors text-slate-700 dark:text-slate-300"
            >
              💸 Analyze Cash Flow
            </button>
            <button 
              onClick={() => { setInput("Provide a tax preparation summary. What are my estimated deductible expenses and taxable revenue?"); }}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-full hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-900/20 transition-colors text-slate-700 dark:text-slate-300"
            >
              📝 Tax Prep Summary
            </button>
            <button 
              onClick={() => { setInput("Perform a complex cost-benefit analysis on my recent expenses. Where can I optimize spending?"); }}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-full hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-900/20 transition-colors text-slate-700 dark:text-slate-300"
            >
              🔍 Identify Cost Savings
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 relative z-10">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text" 
              placeholder="Ask about profit margins, cash flow, or tax summaries..."
              className="w-full pl-6 pr-14 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white shadow-sm transition-all text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:scale-100 hover:scale-105 active:scale-95 shadow-md"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="flex justify-center mt-3 gap-4">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={10} /> Powered by Gemini Financial Logic
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
