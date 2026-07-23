import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Calendar, ChevronRight, Check, ExternalLink, Lightbulb, Clock, Loader2, X, Plus } from 'lucide-react';
import { meetingService, type MeetingResponse } from '@/services/meetingService';
import { toast } from 'sonner';

export default function WorkspaceMeetings() {
  const { workspace } = useOutletContext<any>();
  const navigate = useNavigate();
  
  const [meetings, setMeetings] = useState<MeetingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  
  // States for external meeting Join Prompt
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinLink, setJoinLink] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');

  const loadMeetings = async () => {
    try {
      const data = await meetingService.getMeetings(workspace.startupUuid);
      setMeetings(data);
    } catch (e) {
      /* console.error removed */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, [workspace.startupUuid]);

  const upcomingMeetings = useMemo(() => meetings.filter(m => m.status === 'SCHEDULED'), [meetings]);
  const ongoingMeetings = useMemo(() => meetings.filter(m => m.status === 'ONGOING'), [meetings]);
  const pastMeetings = useMemo(() => meetings.filter(m => m.status === 'COMPLETED'), [meetings]);

  const platforms = [
    {
      id: 'google-meet',
      name: 'Google Meet',
      description: 'Create secure video meetings with Google Meet.',
      features: ['High quality video calls', 'Screen sharing', 'Google account required'],
      logo: 'meet',
      createUrl: 'https://meet.google.com/new',
      color: 'glass-surface',
      logoStyle: 'w-16 h-16'
    },
    {
      id: 'ms-teams',
      name: 'Microsoft Teams',
      description: 'Collaborate and meet with Microsoft Teams.',
      features: ['HD video meetings', 'Screen sharing', 'Microsoft account required'],
      logo: 'teams',
      createUrl: 'https://teams.microsoft.com/v2/',
      color: 'glass-surface',
      logoStyle: 'w-16 h-16'
    },
    {
      id: 'zoom',
      name: 'Zoom',
      description: 'Host engaging meetings with Zoom.',
      features: ['Up to 100 participants', 'Screen sharing', 'Zoom account required'],
      logo: 'zoom',
      createUrl: 'https://zoom.us/start/videomeeting',
      color: 'bg-blue-600',
      logoStyle: ''
    },
    {
      id: 'skype',
      name: 'Skype',
      description: 'Connect face to face with Skype.',
      features: ['HD video calls', 'Screen sharing', 'Skype account required'],
      logo: 'skype',
      createUrl: 'https://web.skype.com/',
      color: 'glass-surface',
      logoStyle: 'w-16 h-16'
    }
  ];

  const handleJoin = () => {
    if (!joinLink) {
      toast.error('Please enter a valid meeting link');
      return;
    }
    
    // Basic validation
    let finalLink = joinLink;
    if (!joinLink.startsWith('http://') && !joinLink.startsWith('https://')) {
       finalLink = 'https://' + joinLink;
    }
    window.open(finalLink, '_blank');
    
    setShowJoinModal(false);
    setJoinLink('');
  };

  const renderPlatformLogo = (id: string) => {
    switch (id) {
      case 'google-meet':
        return (
          <div className="w-20 h-20 glass-surface rounded-[24px] flex items-center justify-center shadow-sm border border-[var(--glass-border)] group-hover:scale-105 transition-transform duration-300 overflow-hidden">
            <img src="/google-meet-logo.png" alt="Google Meet" className="w-16 h-16 object-contain" />
          </div>
        );
      case 'ms-teams':
        return (
          <div className="w-20 h-20 bg-primary/5 rounded-[24px] flex items-center justify-center shadow-sm border border-[var(--glass-border)] group-hover:scale-105 transition-transform duration-300">
            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.5 13.5C13.5 11.567 15.067 10 17 10H19C20.933 10 22.5 11.567 22.5 13.5V17C22.5 17.5523 22.0523 18 21.5 18H14.5C13.9477 18 13.5 17.5523 13.5 17V13.5Z" fill="#5059C9"/>
              <path d="M18 9C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6C15 7.65685 16.3431 9 18 9Z" fill="#5059C9"/>
              <path d="M1.5 13C1.5 10.2386 3.73858 8 6.5 8H11.5C14.2614 8 16.5 10.2386 16.5 13V19C16.5 20.1046 15.6046 21 14.5 21H3.5C2.39543 21 1.5 20.1046 1.5 19V13Z" fill="#7B83EB"/>
              <path d="M9 7C11.2091 7 13 5.20914 13 3C13 0.790861 11.2091 -1 9 -1C6.79086 -1 5 0.790861 5 3C5 5.20914 6.79086 7 9 7Z" fill="#7B83EB"/>
              <path d="M11 13H7V17H11V13Z" fill="#FFFFFF"/>
              <path d="M9 11H9.01" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        );
      case 'skype':
        return (
          <div className="w-20 h-20 glass-surface rounded-[24px] flex items-center justify-center shadow-sm border border-[var(--glass-border)] group-hover:scale-105 transition-transform duration-300 overflow-hidden">
            <img src="/skype-logo.jpg" alt="Skype" className="w-full h-full object-cover" />
          </div>
        );
      case 'zoom':
        return (
          <div className="w-20 h-20 bg-blue-600 rounded-[24px] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
            <svg className="w-11 h-11 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.5 7.5A2.5 2.5 0 0 0 2 10v4a2.5 2.5 0 0 0 2.5 2.5h11A2.5 2.5 0 0 0 18 14v-4a2.5 2.5 0 0 0-2.5-2.5h-11z" />
              <path d="M22 8.25l-3.5 2.5v2.5l3.5 2.5v-7.5z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
        <div>
          <div className="flex items-center text-3xl font-bold text-foreground dark:text-white mb-2">
            <div className="w-10 h-10 bg-primary/20 dark:bg-indigo-900/30 text-primary dark:text-primary rounded-xl flex items-center justify-center mr-3 shadow-sm border border-primary/30 dark:border-indigo-800">
              <Calendar className="w-5 h-5" />
            </div>
            Meetings
          </div>
          <p className="text-white/80 dark:text-muted-foreground text-[15px] font-medium">Connect with your team using your preferred meeting platform</p>
        </div>
        
        <button 
          onClick={() => setShowHistory(true)}
          className="mt-4 md:mt-0 flex items-center px-4 py-2.5 glass-surface border border-[var(--glass-border)] dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl text-muted-foreground dark:text-gray-200 font-bold text-sm shadow-sm transition-all group"
        >
          <Clock className="w-4 h-4 mr-2 text-muted-foreground group-hover:text-muted-foreground dark:group-hover:text-muted-foreground" />
          Meeting History
          <ChevronRight className="w-4 h-4 ml-1 text-muted-foreground group-hover:text-muted-foreground dark:group-hover:text-muted-foreground" />
        </button>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 mb-12">
        {platforms.map(platform => (
          <div key={platform.id} className="glass-surface rounded-[28px] p-6 border border-[var(--glass-border)] dark:border-gray-700 shadow-[var(--shadow-glass-sm)] flex flex-col hover:shadow-[var(--shadow-glass-lg)] transition-all duration-[var(--duration-smooth)] ease-[var(--ease-apple)] group">
            <div className="flex flex-col items-center text-center mb-6">
              {renderPlatformLogo(platform.id)}
              <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">{platform.name}</h3>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground px-1 leading-relaxed">{platform.description}</p>
            </div>

            <div className="flex-1 bg-primary/5 dark:bg-indigo-900/10 rounded-2xl p-5 mb-6 border border-gray-50 dark:border-indigo-900/20">
              <ul className="space-y-3.5">
                {platform.features.map((feature, i) => (
                  <li key={i} className="flex items-start text-[13px] font-medium text-muted-foreground dark:text-muted-foreground">
                    <Check className="w-4 h-4 text-primary dark:text-primary mr-2.5 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 mt-auto">
              <a 
                href={platform.createUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors shadow-sm text-sm"
              >
                <Plus className="w-4 h-4 mr-2 opacity-80" />
                Create Meeting
              </a>
              <button 
                onClick={() => {
                  setSelectedPlatform(platform.name);
                  setShowJoinModal(true);
                }}
                className="flex w-full items-center justify-center py-3 glass-surface border border-[var(--glass-border)] dark:border-gray-700 hover:border-primary/30 hover:text-primary dark:hover:border-indigo-800 dark:hover:text-primary text-muted-foreground dark:text-muted-foreground font-semibold rounded-xl transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4 mr-2 opacity-70" />
                Join Meeting
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="glass-surface rounded-[28px] p-8 mb-8 border border-border relative overflow-hidden">
        <h3 className="text-lg font-bold flex items-center text-foreground dark:text-white mb-8">
          <span className="text-[#5244E3] mr-2">✨</span> How it works?
        </h3>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-4 relative z-10">
          {/* Connecting Line for Desktop */}
          <div className="hidden md:block absolute top-6 left-16 right-16 h-[2px] bg-primary/20 glass-surface -z-10"></div>
          
          <div className="flex-1 flex flex-col md:items-center md:text-center z-10 px-2">
            <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg mb-4 shadow-md shadow-indigo-200 dark:shadow-none ring-4 ring-transparent dark:ring-gray-800/30">1</div>
            <h4 className="font-bold text-foreground mb-1.5 text-[15px]">Choose Platform</h4>
            <p className="text-sm text-foreground/80 max-w-[200px] leading-relaxed">Select your preferred meeting platform</p>
          </div>

          <ChevronRight className="hidden md:block w-6 h-6 text-indigo-300 dark:text-muted-foreground flex-shrink-0 mt-[-50px]" />

          <div className="flex-1 flex flex-col md:items-center md:text-center z-10 px-2">
            <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg mb-4 shadow-md shadow-indigo-200 dark:shadow-none ring-4 ring-transparent dark:ring-gray-800/30">2</div>
            <h4 className="font-bold text-foreground mb-1.5 text-[15px]">Create Meeting</h4>
            <p className="text-sm text-foreground/80 max-w-[200px] leading-relaxed">Create a new meeting on the platform</p>
          </div>

          <ChevronRight className="hidden md:block w-6 h-6 text-indigo-300 dark:text-muted-foreground flex-shrink-0 mt-[-50px]" />

          <div className="flex-1 flex flex-col md:items-center md:text-center z-10 px-2">
            <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg mb-4 shadow-md shadow-indigo-200 dark:shadow-none ring-4 ring-transparent dark:ring-gray-800/30">3</div>
            <h4 className="font-bold text-foreground mb-1.5 text-[15px]">Share Link</h4>
            <p className="text-sm text-foreground/80 max-w-[200px] leading-relaxed">Copy the meeting link and share with your team</p>
          </div>

          <ChevronRight className="hidden md:block w-6 h-6 text-indigo-300 dark:text-muted-foreground flex-shrink-0 mt-[-50px]" />

          <div className="flex-1 flex flex-col md:items-center md:text-center z-10 relative px-2">
            <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg mb-4 shadow-md shadow-indigo-200 dark:shadow-none ring-4 ring-transparent dark:ring-gray-800/30">4</div>
            <h4 className="font-bold text-foreground mb-1.5 text-[15px]">Join & Collaborate</h4>
            <p className="text-sm text-foreground/80 max-w-[200px] leading-relaxed">Join the meeting and collaborate effectively</p>
          </div>
        </div>
        
        {/* Decorative Icon */}
        <div className="absolute right-0 bottom-0 w-32 h-32 opacity-[0.03] pointer-events-none hidden lg:block translate-x-4 translate-y-4">
          <Calendar className="w-full h-full text-indigo-900" />
        </div>
      </div>

      {/* Important Note */}
      <div className="bg-yellow-500/10 dark:bg-amber-900/10 border border-[#FDEBBA] dark:border-amber-800/30 rounded-2xl p-5 flex items-start shadow-sm">
        <div className="w-8 h-8 rounded-full bg-yellow-500/20 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mr-4 mt-1">
          <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-amber-500" />
        </div>
        <div>
          <h4 className="font-bold text-foreground dark:text-amber-500 mb-1">Important Note</h4>
          <p className="text-sm font-medium text-muted-foreground dark:text-amber-400/80 leading-relaxed">You will be redirected to the respective platform to create or join meetings. Make sure you have an account with the selected platform.</p>
        </div>
      </div>

      {/* Modal / Sidebar for Meeting History */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 /20 backdrop-blur-sm" onClick={() => setShowHistory(false)}></div>
          <div className="relative w-full max-w-md glass-surface h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-[var(--glass-border)] dark:border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-[var(--glass-border)] dark:border-gray-700 glass-surface sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-white">Meeting History</h2>
                <p className="text-white/80 mt-1">Your legacy SYNERGi meetings</p>
              </div>
              <button onClick={() => setShowHistory(false)} className="p-2 text-muted-foreground hover:text-foreground dark:hover:text-gray-100 glass-surface hover:glass-surface dark:hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 glass-surface/50 dark:bg-transparent">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <>
                  {ongoingMeetings.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-red-500 mb-3 uppercase tracking-wider flex items-center">
                        <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                        Ongoing Now
                      </h3>
                      <div className="space-y-3">
                        {ongoingMeetings.map(m => (
                          <div key={m.uuid} className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-5 rounded-2xl shadow-sm">
                            <h4 className="font-bold text-red-900 dark:text-red-100 text-lg">{m.title}</h4>
                            <p className="text-sm text-red-700/80 dark:text-red-300/80 mt-1.5 mb-4">{m.description}</p>
                            <button onClick={() => navigate('room/' + m.uuid)} className="w-full py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm">Join Meeting</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground dark:text-muted-foreground mb-3 uppercase tracking-wider">Scheduled</h3>
                    {upcomingMeetings.length === 0 ? (
                      <div className="glass-surface border border-[var(--glass-border)] dark:border-gray-800 p-6 rounded-2xl text-center text-sm text-muted-foreground">No upcoming meetings.</div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingMeetings.map(m => (
                          <div key={m.uuid} className="glass-surface border border-[var(--glass-border)] dark:border-gray-800 p-5 rounded-2xl shadow-sm hover:border-primary/30 transition-colors group">
                            <h4 className="font-bold text-foreground dark:text-gray-100">{m.title}</h4>
                            <div className="flex items-center text-sm text-muted-foreground mt-2 font-medium">
                              <Calendar className="w-4 h-4 mr-1.5 text-primary" /> {new Date(m.scheduledStartTime).toLocaleString()}
                            </div>
                            <button onClick={() => navigate('room/' + m.uuid)} className="w-full mt-4 py-2.5 bg-primary/10 glass-surface border border-primary/30 border-primary/30 text-indigo-700 dark:text-primary rounded-xl text-sm font-semibold hover:bg-primary/20 dark:hover:bg-indigo-900/20 transition-colors group-hover:bg-indigo-600 group-hover:text-white group-hover:border-transparent">Enter Room</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground dark:text-muted-foreground mb-3 uppercase tracking-wider">Past</h3>
                    {pastMeetings.length === 0 ? (
                      <div className="glass-surface border border-[var(--glass-border)] dark:border-gray-800 p-6 rounded-2xl text-center text-sm text-muted-foreground">No past meetings.</div>
                    ) : (
                      <div className="space-y-3">
                        {pastMeetings.map(m => (
                          <div key={m.uuid} className="glass-surface border border-[var(--glass-border)] dark:border-gray-800 p-5 rounded-2xl opacity-75">
                            <h4 className="font-bold text-muted-foreground dark:text-muted-foreground">{m.title}</h4>
                            <div className="flex items-center text-sm text-muted-foreground mt-1.5 font-medium">
                              <Clock className="w-4 h-4 mr-1.5 text-muted-foreground" /> Ended {new Date(m.endedAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Join Link Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 /40 backdrop-blur-sm" onClick={() => setShowJoinModal(false)}></div>
          <div className="relative glass-surface w-full max-w-sm rounded-[24px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-primary/20 dark:bg-indigo-900/50 text-primary rounded-2xl flex items-center justify-center mb-5">
              <ExternalLink className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">Join {selectedPlatform} Meeting</h3>
            <p className="text-[15px] font-medium text-muted-foreground leading-relaxed mb-6">Enter the meeting link or ID provided by the host.</p>
            
            <div className="mb-8">
              <input 
                type="text" 
                value={joinLink}
                onChange={e => setJoinLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3.5 glass-surface border border-[var(--glass-border)] dark:border-gray-700 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:border-primary dark:text-white transition-all outline-none font-medium text-[15px]"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
              />
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-3 px-4 glass-surface hover:glass-surface dark:hover:bg-white/10 text-muted-foreground dark:text-gray-200 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleJoin}
                className="flex-1 py-3 px-4 bg-[#5244E3] hover:bg-[#4335CC] text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                Join Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
