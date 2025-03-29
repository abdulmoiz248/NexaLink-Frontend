"use client"

import { useState, useRef, useEffect } from "react"
import { MessageInput } from "@/components/chat/message-input"
import { MessageItem } from "@/components/chat/message-item"
import { ArrowLeft, Phone, Video, X, Mic, MicOff, Camera, CameraOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import axios from "axios"
import io from "socket.io-client"

// Create socket outside component to prevent multiple connections
let socket: any
let socketInitialized = false

type Message = {
  _id: string
  sender: string
  receiver: string
  message: string
  delivered: boolean
  read: boolean
  time?: Date
  timestamp?: Date
  createdAt?: string
}

type User = {
  _id: string
  username: string
  gradient?: string
  isOnline?: boolean
}

// For video calling
type PeerState = {
  localStream?: MediaStream
  remoteStream?: MediaStream
  peerConnection?: RTCPeerConnection
  callActive: boolean
  incomingCall: boolean
  callerId?: string
  signal?: any
  isVideo: boolean
  isMuted: boolean
  isCameraOff: boolean
  connectionState: "new" | "connecting" | "connected" | "disconnected" | "failed" | "closed"
}

// Chat history response type from backend
type ChatHistoryResponse = {
  sender: Message[] // Messages sent by the other user
  reciever: Message[] // Messages sent by the current user
}

const getRandomGradient = () => {
  const gradients = [
    "bg-gradient-to-r from-purple-500 to-pink-500",
    "bg-gradient-to-r from-blue-500 to-cyan-500",
    "bg-gradient-to-r from-green-500 to-lime-500",
    "bg-gradient-to-r from-yellow-500 to-orange-500",
    "bg-gradient-to-r from-red-500 to-purple-500",
  ]
  return gradients[Math.floor(Math.random() * gradients.length)]
}

export function ChatScreen({ id }: { id: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [processedMessageIds] = useState<Set<string>>(new Set())
  const [activeUsers, setActiveUsers] = useState<string[]>([])
  const [hasJoined, setHasJoined] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Message[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([])
  const isCallerRef = useRef<boolean>(false)

  // Video call state
  const [peerState, setPeerState] = useState<PeerState>({
    callActive: false,
    incomingCall: false,
    isVideo: true,
    isMuted: false,
    isCameraOff: false,
    connectionState: "new",
  })

  // Initialize socket connection only once
  useEffect(() => {
    if (!socketInitialized) {
      socket = io(process.env.NEXT_PUBLIC_URL_Socket || "http://localhost:3001", {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })
      socketInitialized = true
      console.log("Socket initialized")
    }

    // Cleanup function for component unmount
    return () => {
      // We don't disconnect the socket here as it might be used by other components
    }
  }, [])

  // Fetch user data and chat history
  useEffect(() => {
    const username = localStorage.getItem("username")
    setCurrentUser(username)

    const fetchUserAndMessages = async () => {
      try {
        setLoading(true)

        // Fetch user data
        const userResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_URL || "http://localhost:3001"}/user/search?username=${id}`,
          {
            withCredentials: true,
          },
        )

        const userData = {
          _id: userResponse.data._id,
          username: userResponse.data.username,
          gradient: getRandomGradient(),
        }

        setUser(userData)

        if (!username) {
          setError("User not logged in")
          return
        }

        // Fetch chat history with updated response format
        const historyResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_URL || "http://localhost:3001"}/chat/history?receiverId=${userData.username}`,
          {
            withCredentials: true,
          },
        )

        console.log("Chat history:", historyResponse.data)

        const chatHistory = historyResponse.data as ChatHistoryResponse
        let allMessages: Message[] = []

        // Add messages from sender array (messages sent by the other user)
        if (Array.isArray(chatHistory.sender)) {
          allMessages = [...allMessages, ...chatHistory.sender]
        }

        // Add messages from receiver array (messages sent by current user)
        if (Array.isArray(chatHistory.reciever)) {
          allMessages = [...allMessages, ...chatHistory.reciever]
        }

        // Sort messages by time field (which is the timestamp from the database)
        allMessages.sort((a, b) => {
          const timeA = a.time
            ? new Date(a.time).getTime()
            : a.timestamp
              ? new Date(a.timestamp).getTime()
              : a.createdAt
                ? new Date(a.createdAt).getTime()
                : 0

          const timeB = b.time
            ? new Date(b.time).getTime()
            : b.timestamp
              ? new Date(b.timestamp).getTime()
              : b.createdAt
                ? new Date(b.createdAt).getTime()
                : 0

          return timeA - timeB
        })

        // Add all message IDs to processed set
        allMessages.forEach((msg) => {
          if (msg._id) {
            processedMessageIds.add(msg._id)
          }
        })

        setMessages(allMessages)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load chat")
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndMessages()
  }, [id, processedMessageIds])

  // Join socket and open chat - only once when both user and currentUser are available
  useEffect(() => {
    if (!socket || !socketInitialized || !user || !currentUser || hasJoined) return

    console.log("Joining chat as:", currentUser)
    socket.emit("join", currentUser)
    setHasJoined(true)

    // Mark messages as read when opening chat
    socket.emit("openChat", {
      senderId: currentUser,
      receiverId: user.username,
    })

    // Cleanup function for when component unmounts
    return () => {
      // if (socket && hasJoined) {
      //   socket.emit("disconnectUser", currentUser)
      // }
    }
  }, [user, currentUser, hasJoined])

  // Handle socket events
  useEffect(() => {
    if (!socket || !socketInitialized) return

    const handleNewMessage = (data: {
      sender: string
      receiver?: string
      message: string
      _id?: string
      delivered?: boolean
    }) => {
      console.log("New message received:", data)

      const messageId = data._id || Date.now().toString()

      // Check if we've already processed this message
      if (processedMessageIds.has(messageId)) {
        console.log("Message already processed, skipping:", messageId)
        return
      }

      // For messages sent by the current user, only add them if they're not already in the state
      // This prevents duplicates when the server echoes back our own messages
      if (data.sender === currentUser) {
        // Check if we already have this message in our state (based on content and sender)
        const isDuplicate = messages.some(
          (msg) =>
            msg.sender === data.sender &&
            msg.message === data.message &&
            // Check if the message was sent within the last 5 seconds (to handle slight timing differences)
            new Date().getTime() - (msg.time ? new Date(msg.time).getTime() : new Date().getTime()) < 5000,
        )

        if (isDuplicate) {
          console.log("Duplicate message detected, skipping")
          processedMessageIds.add(messageId)
          return
        }
      }

      const newMessage = {
        _id: messageId,
        sender: data.sender,
        receiver: data.receiver || currentUser || "",
        message: data.message,
        delivered: data.delivered || false,
        read: false,
        time: new Date(),
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
      }

      processedMessageIds.add(messageId)
      setMessages((prev) => [...prev, newMessage])

      // Mark as read if this chat is open
      if (user && data.sender === user.username) {
        socket.emit("openChat", {
          senderId: currentUser,
          receiverId: user.username,
        })
      }
    }

    const handleActiveUsers = (users: string[]) => {
      console.log("Active users:", users)
      setActiveUsers(users)

      // Update user online status if needed
      if (user && users.includes(user.username)) {
        setUser((prev) => (prev ? { ...prev, isOnline: true } : null))
      } else if (user) {
        setUser((prev) => (prev ? { ...prev, isOnline: false } : null))
      }
    }

    const handleTyping = ({ sender }: { sender: string }) => {
      if (user && sender === user.username) {
        setIsTyping(true)

        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }

        // Set new timeout
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false)
        }, 3000)
      }
    }

    const handleStopTyping = ({ sender }: { sender: string }) => {
      if (user && sender === user.username) {
        setIsTyping(false)
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
      }
    }

    const handleMessageSeen = ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.map((msg) => (msg._id === messageId ? { ...msg, read: true } : msg)))
    }

    const handleMessageDelivered = ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.map((msg) => (msg._id === messageId ? { ...msg, delivered: true } : msg)))
    }

    // Call handlers
    const handleIncomingCall = ({ sender, signal }: { sender: string; signal: any }) => {
      console.log("Incoming call from:", sender, signal)
      if (user && sender === user.username) {
        // We're the callee, not the caller
        isCallerRef.current = false

        setPeerState((prev) => ({
          ...prev,
          incomingCall: true,
          callerId: sender,
          signal,
          connectionState: "connecting",
        }))
      }
    }

    const handleCallAccepted = ({ signal }: { signal: any }) => {
      console.log("Call accepted with signal:", signal)

      if (peerConnectionRef.current && isCallerRef.current) {
        try {
          // Only set remote description if we're the caller
          peerConnectionRef.current
            .setRemoteDescription(new RTCSessionDescription(signal))
            .then(() => {
              console.log("Remote description set successfully")

              // Now we can add any pending ICE candidates
              if (pendingCandidatesRef.current.length > 0) {
                console.log("Adding pending ICE candidates:", pendingCandidatesRef.current.length)
                pendingCandidatesRef.current.forEach((candidate) => {
                  peerConnectionRef.current
                    ?.addIceCandidate(candidate)
                    .catch((err) => console.error("Error adding pending ICE candidate:", err))
                })
                pendingCandidatesRef.current = []
              }

              setPeerState((prev) => ({
                ...prev,
                connectionState: "connected",
              }))
            })
            .catch((err) => {
              console.error("Error setting remote description:", err)
            })
        } catch (err) {
          console.error("Error in call accepted handler:", err)
        }
      } else {
        console.log("Not setting remote description - not the caller or peer connection not initialized")
      }

      setPeerState((prev) => ({
        ...prev,
        callActive: true,
        incomingCall: false,
      }))
    }

    const handleCallEnded = () => {
      console.log("Call ended")
      // Clean up streams
      if (peerState.localStream) {
        peerState.localStream.getTracks().forEach((track) => track.stop())
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }

      setPeerState({
        callActive: false,
        incomingCall: false,
        isVideo: true,
        isMuted: false,
        isCameraOff: false,
        connectionState: "new",
      })

      // Reset caller status
      isCallerRef.current = false
    }

    const handleIceCandidate = ({ sender, candidate }: { sender: string; candidate: any }) => {
      console.log("Received ICE candidate from:", sender)

      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        try {
          peerConnectionRef.current
            .addIceCandidate(new RTCIceCandidate(candidate))
            .then(() => console.log("ICE candidate added successfully"))
            .catch((err) => console.error("Error adding ICE candidate:", err))
        } catch (err) {
          console.error("Error processing ICE candidate:", err)
        }
      } else {
        // Store the candidate to add later when remote description is set
        console.log("Storing ICE candidate for later")
        pendingCandidatesRef.current.push(new RTCIceCandidate(candidate))
      }
    }

    // Register event handlers
    socket.on("newMessage", handleNewMessage)
    socket.on("activeUsers", handleActiveUsers)
    socket.on("typing", handleTyping)
    socket.on("stopTyping", handleStopTyping)
    socket.on("messageSeen", handleMessageSeen)
    socket.on("messageDelivered", handleMessageDelivered)
    socket.on("callUser", handleIncomingCall)
    socket.on("callAccepted", handleCallAccepted)
    socket.on("callEnded", handleCallEnded)
    socket.on("iceCandidate", handleIceCandidate)

    // Clean up event handlers
    return () => {
      socket.off("newMessage", handleNewMessage)
      socket.off("activeUsers", handleActiveUsers)
      socket.off("typing", handleTyping)
      socket.off("stopTyping", handleStopTyping)
      socket.off("messageSeen", handleMessageSeen)
      socket.off("messageDelivered", handleMessageDelivered)
      socket.off("callUser", handleIncomingCall)
      socket.off("callAccepted", handleCallAccepted)
      socket.off("callEnded", handleCallEnded)
      socket.off("iceCandidate", handleIceCandidate)

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [currentUser, user, peerState, processedMessageIds, messages])

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Group messages by date
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [date: string]: Message[] } = {}

    msgs.forEach((msg) => {
      const timestamp =
      msg.time ||
      msg.timestamp ||
      (msg.createdAt ? new Date(msg.createdAt) : new Date());
  
    // Ensure timestamp is a Date object before calling toLocaleDateString
    const dateStr = new Date(timestamp).toLocaleDateString();

      if (!groups[dateStr]) {
        groups[dateStr] = []
      }
      groups[dateStr].push(msg)
    })

    return groups
  }

  // Search messages
  const handleSearch = (query: string) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setIsSearching(false)
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const results = messages.filter((msg) => msg.message.toLowerCase().includes(query.toLowerCase()))
    setSearchResults(results)
  }

  // Send message
  const handleSendMessage = (text: string) => {
    if (!text.trim() || !currentUser || !user) return

    const messageId = Date.now().toString()

    // Check if we've already processed this message ID
    if (processedMessageIds.has(messageId)) {
      console.log("Preventing duplicate message:", messageId)
      return
    }

    // Check if we've sent an identical message in the last 2 seconds
    const recentDuplicate = messages.some(
      (msg) =>
        msg.sender === currentUser &&
        msg.message === text.trim() &&
        new Date().getTime() - (msg.time ? new Date(msg.time).getTime() : new Date().getTime()) < 2000,
    )

    if (recentDuplicate) {
      console.log("Preventing duplicate message send")
      return
    }

    processedMessageIds.add(messageId)

    // Create local message object
    const newMessage = {
      _id: messageId,
      sender: currentUser,
      receiver: user.username,
      message: text,
      delivered: false,
      read: false,
      time: new Date(),
    }

    // Add to messages state
    setMessages((prev) => [...prev, newMessage])

    // Send via socket
    console.log("Sending message:", {
      sender: currentUser,
      receiver: user.username,
      message: text,
    })

    socket.emit("sendMessage", {
      sender: currentUser,
      receiver: user.username,
      message: text,
    })
  }

  // Handle typing indicator
  const handleTyping = () => {
    if (user && currentUser) {
      socket.emit("typing", { sender: currentUser, receiver: user.username })
    }
  }

  const handleStopTyping = () => {
    if (user && currentUser) {
      socket.emit("stopTyping", { sender: currentUser, receiver: user.username })
    }
  }

  // Enhanced WebRTC call functions
  const handleStartCall = async (isVideo = true) => {
    if (!user || !currentUser) return

    try {
      console.log(`Starting ${isVideo ? "video" : "audio"} call with:`, user.username)

      // Set caller status
      isCallerRef.current = true

      // Get user media with appropriate constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true,
      })

      // Create a new RTCPeerConnection
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
      })

      // Store the peer connection in the ref
      peerConnectionRef.current = peerConnection

      // Add tracks to the peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream)
      })

      // Set local video stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate to:", user.username)
          socket.emit("iceCandidate", {
            sender: currentUser,
            receiver: user.username,
            candidate: event.candidate,
          })
        }
      }

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log("Connection state changed:", peerConnection.connectionState)
        setPeerState((prev) => ({
          ...prev,
          connectionState: peerConnection.connectionState as any,
        }))
      }

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log("Received remote track")
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }

        setPeerState((prev) => ({
          ...prev,
          remoteStream: event.streams[0],
        }))
      }

      // Create and set local description
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      // Update state with stream and connection
      setPeerState({
        localStream: stream,
        peerConnection: peerConnection,
        callActive: true,
        incomingCall: false,
        isVideo: isVideo,
        isMuted: false,
        isCameraOff: false,
        connectionState: "connecting",
      })

      // Send the offer to the other user
      console.log("Sending call offer to:", user.username)
      socket.emit("callUser", {
        sender: currentUser,
        receiver: user.username,
        signal: peerConnection.localDescription,
      })
    } catch (err) {
      console.error("Error accessing media devices:", err)
      isCallerRef.current = false
    }
  }

  const handleAnswerCall = async () => {
    if (!peerState.incomingCall || !user || !currentUser || !peerState.signal) return

    try {
      console.log("Answering call from:", peerState.callerId)

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      // Set local video stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Create a new RTCPeerConnection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" }
        ]
      });

      // Store the peer connection in the ref
      peerConnectionRef.current = peerConnection

      // Add tracks to the peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream)
      })

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate to:", user.username)
          socket.emit("iceCandidate", {
            sender: currentUser,
            receiver: user.username,
            candidate: event.candidate,
          })
        }
      }

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log("Connection state changed:", peerConnection.connectionState)
        setPeerState((prev) => ({
          ...prev,
          connectionState: peerConnection.connectionState as any,
        }))
      }

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log("Received remote track")
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }

        setPeerState((prev) => ({
          ...prev,
          remoteStream: event.streams[0],
        }))
      }

      // First set remote description from the incoming signal
      await peerConnection.setRemoteDescription(new RTCSessionDescription(peerState.signal))
      console.log("Remote description set successfully")

      // Now we can add any pending ICE candidates
      if (pendingCandidatesRef.current.length > 0) {
        console.log("Adding pending ICE candidates:", pendingCandidatesRef.current.length)
        pendingCandidatesRef.current.forEach((candidate) => {
          peerConnection
            .addIceCandidate(candidate)
            .catch((err) => console.error("Error adding pending ICE candidate:", err))
        })
        pendingCandidatesRef.current = []
      }

      // Create and set local description
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      // Send the answer back
      console.log("Sending call answer to:", user.username)
      socket.emit("answerCall", {
        sender: currentUser,
        receiver: user.username,
        signal: peerConnection.localDescription,
      })

      setPeerState({
        remoteStream: undefined,
        localStream: stream,
        peerConnection: peerConnection,
        incomingCall: false,
        callActive: true,
        isVideo: true,
        isMuted: false,
        isCameraOff: false,
        connectionState: "connecting",
      })
    } catch (err) {
      console.error("Error answering call:", err)
    }
  }

  const handleEndCall = () => {
    if (!user || !currentUser) return

    console.log("Ending call with:", user.username)

    // Clean up streams
    if (peerState.localStream) {
      peerState.localStream.getTracks().forEach((track) => track.stop())
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    socket.emit("endCall", {
      sender: currentUser,
      receiver: user.username,
    })

    setPeerState({
      callActive: false,
      incomingCall: false,
      isVideo: true,
      isMuted: false,
      isCameraOff: false,
      connectionState: "new",
    })

    // Reset caller status
    isCallerRef.current = false
  }

  const toggleMute = () => {
    if (peerState.localStream) {
      const audioTracks = peerState.localStream.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = peerState.isMuted
      })

      setPeerState((prev) => ({
        ...prev,
        isMuted: !prev.isMuted,
      }))
    }
  }

  const toggleCamera = () => {
    if (peerState.localStream) {
      const videoTracks = peerState.localStream.getVideoTracks()
      videoTracks.forEach((track) => {
        track.enabled = peerState.isCameraOff
      })

      setPeerState((prev) => ({
        ...prev,
        isCameraOff: !prev.isCameraOff,
      }))
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-primary">Loading chat...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex items-center">
          <Link href="/chat" className="mr-3">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          {user && (
            <div className="flex items-center">
              <div className="relative mr-3 flex h-10 w-10 items-center justify-center rounded-full text-white font-bold">
                <div className={`absolute inset-0 rounded-full ${user.gradient}`}></div>
                <span className="z-10">{user.username[0].toUpperCase()}</span>
                {user.isOnline && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                )}
              </div>
              <div>
                <h2 className="font-medium">{user.username}</h2>
                <p className="text-xs text-muted-foreground">{user.isOnline ? "Online" : "Offline"}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search messages..."
              className="h-8 w-40 rounded-md bg-muted px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => handleSearch("")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleStartCall(false)}
            disabled={peerState.callActive || peerState.incomingCall}
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleStartCall(true)}
            disabled={peerState.callActive || peerState.incomingCall}
          >
            <Video className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Call UI */}
      {peerState.incomingCall && (
        <div className="bg-primary p-4 text-center text-primary-foreground">
          <p className="text-lg font-medium">Incoming call from {user?.username}</p>
          <div className="mt-3 flex justify-center space-x-4">
            <Button size="sm" className="bg-green-500 hover:bg-green-600 px-4" onClick={handleAnswerCall}>
              Answer
            </Button>
            <Button size="sm" className="bg-red-500 hover:bg-red-600 px-4" onClick={handleEndCall}>
              Decline
            </Button>
          </div>
        </div>
      )}

      {peerState.callActive && (
        <div className="bg-black text-white relative">
          <div className="flex flex-col h-[300px] md:h-[400px]">
            {/* Remote video (full size) */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
              {!peerState.remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xl text-white">
                    {peerState.connectionState === "connecting" ? "Connecting..." : "Waiting for other user..."}
                  </div>
                </div>
              )}
            </div>

            {/* Local video (picture-in-picture) */}
            <div className="absolute bottom-4 right-4 w-1/4 h-1/4 border-2 border-white rounded-lg overflow-hidden shadow-lg">
              <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              {peerState.isCameraOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-80">
                  <div className="text-white text-sm">Camera Off</div>
                </div>
              )}
            </div>

            {/* Call controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center space-x-4 bg-gray-800 bg-opacity-70 px-6 py-3 rounded-full">
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full ${peerState.isMuted ? "bg-red-500 hover:bg-red-600" : "bg-gray-700 hover:bg-gray-600"}`}
                onClick={toggleMute}
              >
                {peerState.isMuted ? <MicOff className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-white" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-red-500 hover:bg-red-600"
                onClick={handleEndCall}
              >
                <Phone className="h-5 w-5 text-white rotate-135" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full ${peerState.isCameraOff ? "bg-red-500 hover:bg-red-600" : "bg-gray-700 hover:bg-gray-600"}`}
                onClick={toggleCamera}
              >
                {peerState.isCameraOff ? (
                  <CameraOff className="h-5 w-5 text-white" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </Button>
            </div>

            {/* Call info */}
            <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-70 px-3 py-1 rounded-full">
              <p className="text-sm text-white">
                Call with {user?.username} ({peerState.connectionState})
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center py-10">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : isSearching ? (
            // Search results
            searchResults.length > 0 ? (
              <div className="space-y-4">
                <p className="text-center text-sm text-muted-foreground">Found {searchResults.length} results</p>
                {searchResults.map((message) => (
                  <MessageItem
                    key={message._id}
                    message={{
                      id: message._id,
                      senderId: message.sender,
                      text: message.message,
                      timestamp: message.time || message.timestamp || new Date(message.createdAt || Date.now()),
                      status: message.read ? "read" : message.delivered ? "delivered" : "sent",
                    }}
                    isOwnMessage={message.sender === currentUser}
                    senderName={message.sender === currentUser ? "You" : user?.username || ""}
                    senderGradient={user?.gradient || "bg-gradient-to-r from-blue-500 to-cyan-500"}
                    highlight={searchQuery}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center py-10">
                <p className="text-muted-foreground">No messages found matching "{searchQuery}"</p>
              </div>
            )
          ) : (
            // Regular message view with date grouping
            Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
              <div key={date} className="mb-6">
                <div className="flex justify-center mb-4">
                  <div className="bg-muted px-3 py-1 rounded-full">
                    <p className="text-xs text-muted-foreground">{date}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {dateMessages.map((message) => (
                    <MessageItem
                      key={message._id}
                      message={{
                        id: message._id,
                        senderId: message.sender,
                        text: message.message,
                        timestamp: message.time || message.timestamp || new Date(message.createdAt || Date.now()),
                        status: message.read ? "read" : message.delivered ? "delivered" : "sent",
                      }}
                      isOwnMessage={message.sender === currentUser}
                      senderName={message.sender === currentUser ? "You" : user?.username || ""}
                      senderGradient={user?.gradient || "bg-gradient-to-r from-blue-500 to-cyan-500"}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
          {isTyping && <div className="text-muted-foreground ml-12">{user?.username} is typing...</div>}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t p-4">
        <MessageInput onSendMessage={handleSendMessage} onTyping={handleTyping} onStopTyping={handleStopTyping} />
      </div>
    </div>
  )
}

