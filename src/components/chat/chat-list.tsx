'use client'
import { useState, useEffect } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import axios from "axios"
import { io } from "socket.io-client"

export interface User {
  _id: string;
  username: string;
  lastMessage: string;
}

const socket = io(process.env.NEXT_PUBLIC_URL as string, { withCredentials: true });

export function ChatList() {
  const [filter, setFilter] = useState("")
  const [chats, setChats] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_URL}/user/all`, {
          withCredentials: true,
        });

        setChats(response.data.map((user: User) => ({
          _id: user._id,
          username: user.username,
          lastMessage: "Click to view",
        })));
      } catch (err) {
        setError("Failed to fetch chats");
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    const username = localStorage.getItem('username');
    if (username) {
      socket.emit('join', { username });

      socket.on('newMessage', ({ sender, message }) => {
        setChats((prevChats) => prevChats.map(chat =>
          chat._id === sender ? { ...chat, lastMessage: message } : chat
        ));
      });
    
      return () => {
        socket.emit('disconnectUser');
        socket.off('newMessage'); // Cleanup listener
        socket.off();
      };
    }
  }, []);

  const filteredChats = chats.filter(
    (chat) =>
      chat.username.toLowerCase().includes(filter.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search conversations..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-9 bg-[#1E293B] border-[#334155] text-white placeholder-slate-400"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-slate-400">Loading...</p>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : filteredChats.length > 0 ? (
          <ul className="space-y-2">
            {filteredChats.map((chat) => (
              <li key={chat._id}>
                <Link href={`/chat/${chat._id}`}>
                  <div className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-[#1E293B]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{chat.username}</h3>
                      </div>
                      <p className="text-sm text-slate-400 truncate">{chat.lastMessage}</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-slate-400">No conversations found</p>
          </div>
        )}
      </div>
    </div>
  );
}
