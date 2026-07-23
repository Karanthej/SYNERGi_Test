import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Mic, MicOff, Video as VideoIcon, VideoOff, MonitorUp, PhoneOff, Users, MessageSquare, Loader2 } from 'lucide-react';
import { meetingService, type MeetingResponse } from '@/services/meetingService';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

// Helper component for Video element
const VideoPlayer = ({ stream, isLocal, name, isMuted, isCameraOff, isScreenSharing }: any) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className=" rounded-2xl overflow-hidden relative group h-full flex flex-col justify-center items-center">
            {isCameraOff && !isScreenSharing ? (
                <div className="w-24 h-24  rounded-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                    {name.charAt(0)}
                </div>
            ) : (
                <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted={isLocal} 
                    className={`w-full h-full object-cover ${isLocal && !isScreenSharing ? 'scale-x-[-1]' : ''}`}
                />
            )}
            
            <div className="absolute bottom-4 left-4 /60 px-3 py-1.5 rounded-lg backdrop-blur-sm text-sm text-white flex items-center">
                {name} {isLocal ? '(You)' : ''}
                {isMuted && <MicOff className="w-3.5 h-3.5 text-red-400 ml-2" />}
            </div>
        </div>
    );
};

export default function MeetingRoom() {
    const { meetingUuid } = useParams<{ meetingUuid: string }>();
    const { workspace } = useOutletContext<any>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [meeting, setMeeting] = useState<MeetingResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSidebar, setShowSidebar] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'chat' | 'participants'>('participants');

    const {
        localStream,
        participants,
        isMuted,
        isCameraOff,
        isScreenSharing,
        toggleAudio,
        toggleVideo,
        toggleScreenShare
    } = useWebRTC(meetingUuid);

    useEffect(() => {
        if (!meetingUuid || !workspace) return;
        
        meetingService.getMeeting(workspace.startupUuid, meetingUuid)
            .then(data => {
                setMeeting(data);
                // Inform backend we joined
                meetingService.joinMeeting(workspace.startupUuid, meetingUuid);
            })
            .catch(() => {
                toast.error("Failed to load meeting");
                navigate(`/talent/workspace/${workspace.startupUuid}/meetings`);
            })
            .finally(() => setLoading(false));
            
        return () => {
            meetingService.leaveMeeting(workspace.startupUuid, meetingUuid).catch(() => {});
        };
    }, [meetingUuid, workspace, navigate]);

    const handleLeave = () => {
        navigate(user?.role === 'FOUNDER' ? `/founder/workspace/${workspace.startupUuid}/meetings` : `/talent/workspace/${workspace.startupUuid}/meetings`);
    };

    const handleEnd = async () => {
        if (window.confirm("Are you sure you want to end this meeting for everyone?")) {
            try {
                await meetingService.endMeeting(workspace.startupUuid, meetingUuid!);
                handleLeave();
            } catch {
                toast.error("Failed to end meeting");
            }
        }
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (!meeting) return null;

    // Grid Layout logic
    const totalParticipants = participants.length + 1; // +1 for local
    const gridCols = totalParticipants === 1 ? 'grid-cols-1' :
                     totalParticipants === 2 ? 'grid-cols-2' :
                     totalParticipants <= 4 ? 'grid-cols-2 grid-rows-2' :
                     totalParticipants <= 9 ? 'grid-cols-3 grid-rows-3' : 'grid-cols-4';

    return (
        <div className="flex flex-col h-[calc(100vh-130px)]  text-white rounded-xl overflow-hidden shadow-xl border border-gray-800 relative">
            
            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Video Grid */}
                <div className={`flex-1 p-4 grid gap-4 ${gridCols}`}>
                    <VideoPlayer 
                        stream={localStream} 
                        isLocal={true} 
                        name={user?.fullName} 
                        isMuted={isMuted} 
                        isCameraOff={isCameraOff}
                        isScreenSharing={isScreenSharing} 
                    />
                    
                    {participants.map(p => (
                        <VideoPlayer 
                            key={p.uuid}
                            stream={p.stream}
                            isLocal={false}
                            name={p.name}
                            isMuted={p.isMuted}
                            isCameraOff={p.isCameraOff}
                            isScreenSharing={p.isScreenSharing}
                        />
                    ))}
                </div>

                {/* Sidebar (Chat / Participants) */}
                {showSidebar && (
                    <div className="w-full max-w-80  border-l border-gray-800 flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.5)] z-10 transition-all duration-300">
                        <div className="flex border-b border-gray-800">
                            <button onClick={() => setSidebarTab('participants')} className={`flex-1 py-3 text-sm font-medium ${sidebarTab === 'participants' ? 'text-primary border-b-2 border-indigo-400' : 'text-muted-foreground hover:text-gray-200'}`}>Participants ({totalParticipants})</button>
                            <button onClick={() => setSidebarTab('chat')} className={`flex-1 py-3 text-sm font-medium ${sidebarTab === 'chat' ? 'text-primary border-b-2 border-indigo-400' : 'text-muted-foreground hover:text-gray-200'}`}>Chat</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {sidebarTab === 'participants' ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-2 rounded-lg ">
                                        <span className="text-sm font-medium">{user?.fullName} (You)</span>
                                        <div className="flex space-x-2 text-muted-foreground">
                                            {isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
                                            {isCameraOff ? <VideoOff className="w-4 h-4 text-red-400" /> : <VideoIcon className="w-4 h-4" />}
                                        </div>
                                    </div>
                                    {participants.map(p => (
                                        <div key={p.uuid} className="flex items-center justify-between p-2 rounded-lg /50">
                                            <span className="text-sm font-medium truncate">{p.name}</span>
                                            <div className="flex space-x-2 text-muted-foreground">
                                                {p.isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
                                                {p.isCameraOff ? <VideoOff className="w-4 h-4 text-red-400" /> : <VideoIcon className="w-4 h-4" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col h-full items-center justify-center text-muted-foreground text-sm">
                                    <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                                    Meeting chat not fully integrated yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Top Bar (Title & Info) */}
            <div className="absolute top-4 left-4 /60 px-4 py-2 rounded-xl backdrop-blur-md flex items-center z-10 shadow-sm border border-white/10">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-3"></div>
                <div>
                    <h3 className="font-bold text-sm text-white">{meeting.title}</h3>
                    <p className="text-xs text-muted-foreground">
                        {Math.floor((Date.now() - new Date(meeting.startedAt || Date.now()).getTime()) / 60000)} min elapsed
                    </p>
                </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="h-24  border-t border-gray-800 flex items-center justify-between px-8 shrink-0 relative z-20">
                <div className="flex-1">
                    {/* Placeholder for left controls */}
                </div>
                
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={toggleAudio}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'glass-surface hover:glass-floating text-white'}`}
                    >
                        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                    <button 
                        onClick={toggleVideo}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isCameraOff ? 'bg-red-500 hover:bg-red-600 text-white' : 'glass-surface hover:glass-floating text-white'}`}
                    >
                        {isCameraOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
                    </button>
                    <button 
                        onClick={toggleScreenShare}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isScreenSharing ? 'bg-green-500 hover:bg-green-600 text-white' : 'glass-surface hover:glass-floating text-white'}`}
                    >
                        <MonitorUp className="w-6 h-6" />
                    </button>
                    
                    <div className="w-px h-10  mx-2"></div>
                    
                    <button 
                        onClick={handleLeave}
                        className="w-16 h-14 bg-red-600 hover:bg-red-700 rounded-2xl flex items-center justify-center transition-colors shadow-lg shadow-red-900/50"
                    >
                        <PhoneOff className="w-6 h-6 text-white" />
                    </button>
                </div>

                <div className="flex-1 flex justify-end space-x-3">
                    <button 
                        onClick={() => { setShowSidebar(!showSidebar); setSidebarTab('participants'); }}
                        className={`p-3 rounded-xl transition-colors ${showSidebar && sidebarTab === 'participants' ? 'bg-indigo-600 text-white' : 'hover:glass-surface text-muted-foreground'}`}
                    >
                        <Users className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => { setShowSidebar(!showSidebar); setSidebarTab('chat'); }}
                        className={`p-3 rounded-xl transition-colors ${showSidebar && sidebarTab === 'chat' ? 'bg-indigo-600 text-white' : 'hover:glass-surface text-muted-foreground'}`}
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                    {user?.uuid === meeting.creatorUuid && (
                        <button 
                            onClick={handleEnd}
                            className="p-3 bg-red-900/30 text-red-500 hover:bg-red-900/50 rounded-xl transition-colors text-sm font-bold ml-4"
                        >
                            End Meeting
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
