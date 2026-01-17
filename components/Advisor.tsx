
import React, { useState, useRef, useEffect } from 'react';
import { Product, Sale } from '../types';
import { getAdvisorChatResponse } from '../services/geminiService';
import { Send, Sparkles, BrainCircuit, User, Bot, History } from 'lucide-react';

interface AdvisorProps {
  products: Product[];
  sales: Sale[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const Advisor: React.FC<AdvisorProps> = ({ products, sales }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I am your AI Business Advisor. I've analyzed your current inventory and sales data. How can I help you grow TheDécorHub today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

    const response = await getAdvisorChatResponse(input, products, sales);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-160px)] flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-800">Strategy Advisor</h2>
          <p className="text-slate-500">Intelligent consulting for your home décor enterprise.</p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
          <BrainCircuit className="text-indigo-600" size={20} />
          <span className="text-xs font-bold text-indigo-800 uppercase tracking-widest">Advanced Model Active</span>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col relative">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
        
        {/* Chat History */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth relative z-10"
        >
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white'
              }`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`max-w-[80%] p-5 rounded-[1.5rem] shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-[10px] mt-2 opacity-60 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-2xl bg-slate-200 flex items-center justify-center">
                <Bot size={20} className="text-slate-400" />
              </div>
              <div className="bg-slate-100 h-16 w-48 rounded-[1.5rem] rounded-tl-none"></div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 relative z-10">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text" 
              placeholder="Ask about inventory gaps, sales trends, or pricing strategy..."
              className="w-full pl-6 pr-14 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:bg-slate-300 disabled:scale-100 hover:scale-105 active:scale-95 shadow-md"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="flex justify-center mt-3 gap-4">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={10} /> Powered by Gemini Strategic Logic
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
