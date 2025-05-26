import React, { useState, useEffect, useRef } from 'react';
import { Device, Call as TwilioCall } from '@twilio/voice-sdk';
import { fetchTwilioToken, fetchContactByPhone, createNoteActivity, NewNoteData } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PhoneIcon, PhoneOffIcon, PhoneIncomingIcon, XIcon, VolumeIcon, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

/**
 * Status values for the Softphone
 */
type CallStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'incoming' 
  | 'ringing'
  | 'reconnecting'
  | 'error';

/**
 * Softphone component for handling browser-based calls using Twilio Voice SDK
 */
const Softphone: React.FC = () => {
  // References and state
  const deviceRef = useRef<Device | null>(null);
  const connectionRef = useRef<TwilioCall | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<CallStatus>('disconnected');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callerInfo, setCallerInfo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [activeCallSid, setActiveCallSid] = useState<string | null>(null);
  const [activeContactId, setActiveContactId] = useState<number | null>(null);
  
  // Note-taking state
  const [noteContent, setNoteContent] = useState('');
  const queryClient = useQueryClient();

  // Initialize AudioContext
  const initializeAudio = () => {
    try {
      console.log('Attempting to initialize AudioContext...');
      if (!audioContextRef.current) {
        // Create a new AudioContext if it doesn't exist
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
        console.log('New AudioContext created:', audioContextRef.current.state);
      }
      
      // Resume the AudioContext if it's suspended
      if (audioContextRef.current.state === 'suspended') {
        console.log('Resuming suspended AudioContext...');
        audioContextRef.current.resume().then(() => {
          console.log('AudioContext resumed successfully:', audioContextRef.current?.state);
          setAudioInitialized(true);
        }).catch(err => {
          console.error('Failed to resume AudioContext:', err);
        });
      } else {
        console.log('AudioContext already running:', audioContextRef.current.state);
        setAudioInitialized(true);
      }
      
      // Create a silent audio node to keep context active (optional)
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 0; // Silent
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.001); // Stop after a very short time
      
      console.log('Audio initialization complete');
      return true;
    } catch (err) {
      console.error('Error initializing AudioContext:', err);
      return false;
    }
  };

  // Set up the Twilio Device
  const setupDevice = async () => {
    try {
      console.log('Setting up Twilio Device...');
      
      // Fetch token from backend
      console.log('Fetching Twilio token from backend...');
      const { token } = await fetchTwilioToken();
      console.log('Twilio token received, initializing Device');
      
      // Clean up any existing Device
      if (deviceRef.current) {
        console.log('Destroying existing Device');
        deviceRef.current.destroy();
        deviceRef.current = null;
      }
      
      // Initialize new Device with debug logging
      console.log('Creating new Device instance...');
      deviceRef.current = new Device(token, {
        logLevel: 'debug', // Enhanced logging
        // Add other options as needed
      });
      
      if (!deviceRef.current) {
        throw new Error("Failed to create Device instance");
      }
      
      // CRITICAL: Explicitly register the device to open signaling WebSocket
      console.log('Attempting to register Twilio Device...');
      await deviceRef.current.register();
      
      console.log('Device created, registering event handlers...');
      // Register event handlers immediately after Device creation
      registerDeviceEvents();
      
      // Mark as ready
      setIsReady(true);
      setError(null);
      console.log('Twilio Device initialized successfully, ready for calls');
      
      // Log additional registration info
      console.log('Device Registration Details:', {
        identity: 'agent1',
        token: token.substring(0, 20) + '...',  // Log partial token for debugging
        registered: isReady,  // Check if this is available
        deviceExists: !!deviceRef.current,  // Check internal state
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Twilio Device';
      console.error('Error initializing Twilio Device:', err);
      setError(errorMessage);
      toast({
        title: 'Softphone Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Initialize the Twilio Device AFTER audio is initialized
  useEffect(() => {
    console.log('Softphone component mounted');
    
    // Only setup device once audio is initialized
    if (audioInitialized) {
      console.log('Audio initialized, proceeding with Twilio Device setup');
      setupDevice();
    } else {
      console.log('Waiting for audio initialization before setting up Twilio Device');
    }
    
    // Cleanup function
    return () => {
      console.log('Component unmounting, cleaning up resources');
      if (deviceRef.current) {
        console.log('Destroying Twilio Device');
        deviceRef.current.destroy();
        deviceRef.current = null;
      }
      if (audioContextRef.current) {
        console.log('Closing AudioContext');
        audioContextRef.current.close().catch(err => {
          console.error('Error closing AudioContext:', err);
        });
      }
    };
  }, [audioInitialized]); // Only re-run when audioInitialized changes
  
  // Register event handlers for the Twilio Device
  const registerDeviceEvents = () => {
    if (!deviceRef.current) {
      console.error('Cannot register events - Device is null');
      return;
    }
    
    // Called when the Device is registered and ready to make/receive calls
    deviceRef.current.on('registered', () => {
      console.log('>>> DEVICE EVENT: registered - Device is registered and ready');
      setStatus('disconnected');
      setIsReady(true);
      
      // Log additional registration info
      console.log('Device Registration Details:', {
        identity: 'agent1',
        deviceRegistered: isReady,
        deviceExists: !!deviceRef.current
      });
    });
    
    /**
     * Twilio error object (see Twilio Voice JS SDK docs for structure)
     * @param twilioError - Twilio error object, typically has .code and .message
     */
    deviceRef.current.on('error', (twilioError: any) => {
      console.error('>>> DEVICE EVENT: error', twilioError);
      console.error('Error details:', {
        code: twilioError.code,
        message: twilioError.message,
        info: (twilioError as any).info,
        explanation: (twilioError as any).explanation
      });
      
      setError(`Twilio error: ${twilioError.message || 'Unknown error'}`);
      setStatus('error');
      toast({
        title: 'Softphone Error',
        description: twilioError.message || 'An error occurred with the phone connection',
        variant: 'destructive',
      });
    });
    
    // Called when there's an incoming call
    deviceRef.current.on('incoming', (connection: TwilioCall) => {
      // Immediate logging first for debugging
      console.log('>>> DEVICE EVENT: incoming', connection);
      // @ts-ignore: parameters is not in TwilioCall typings but is present at runtime
      console.log('Connection parameters:', (connection as any).parameters);
      
      // Immediate visual feedback for testing
      document.body.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
      setTimeout(() => {
        document.body.style.backgroundColor = '';
      }, 5000); // Reset after 5 seconds
      
      // @ts-ignore
      const from = (connection as any).parameters?.From || 'Unknown caller';
      setCallerInfo(from);
      setStatus('incoming');
      // Set active call SID
      // @ts-ignore
      setActiveCallSid((connection as any).parameters?.CallSid || null);
      // Lookup contact by phone number
      (async () => {
        const phone = (connection as any).parameters?.From;
        if (phone) {
          console.log('Looking up contact for incoming call from:', phone);
          const contact = await fetchContactByPhone(phone);
          if (contact) {
            setActiveContactId(contact.id);
            setCallerInfo(`${contact.first_name} ${contact.last_name} (${phone})`);
            console.log('Contact found for incoming call:', contact);
          } else {
            setActiveContactId(null);
            console.log('No contact found for incoming call from:', phone);
          }
        } else {
          setActiveContactId(null);
          console.log('No From parameter for incoming call');
        }
      })();
      
      toast({
        title: 'Incoming Call',
        description: `Call from ${from}`,
        variant: 'default',
      });
      
      // Handle connection events
      console.log('Registering connection event handlers for incoming call');
      registerConnectionEvents(connection);
    });
    
    // Additional device events to monitor
    deviceRef.current.on('connect', (connection: TwilioCall) => {
      console.log('>>> DEVICE EVENT: connect - Successfully established call', connection);
      connectionRef.current = connection;
      registerConnectionEvents(connection);
    });
    
    deviceRef.current.on('disconnect', (connection: TwilioCall) => {
      console.log('>>> DEVICE EVENT: disconnect - Call ended', connection);
      connectionRef.current = null;
      setStatus('disconnected');
      setCallerInfo('');
      // Clear note content when call ends
      setNoteContent('');
    });
    
    deviceRef.current.on('offline', () => {
      console.log('>>> DEVICE EVENT: offline - Device is offline');
      setStatus('error');
      setError('Device is offline. Check your network connection.');
    });
    
    deviceRef.current.on('unregistered', () => {
      console.log('>>> DEVICE EVENT: unregistered - Device is unregistered');
      setIsReady(false);
    });
    
    // These events might not exist in all versions, so check if they're supported
    if (typeof deviceRef.current.on === 'function') {
      try {
        deviceRef.current.on('tokenWillExpire', () => {
          console.log('>>> DEVICE EVENT: tokenWillExpire - Token is about to expire');
          // Here you would implement token refresh logic
        });
        
        deviceRef.current.on('ready', () => {
          console.log('>>> DEVICE EVENT: ready - Device is ready');
        });
      } catch (e) {
        console.log('Some device events are not supported in this version');
      }
    }
  };
  
  // Register event handlers for a specific call connection
  const registerConnectionEvents = (connection: TwilioCall) => {
    if (!connection) {
      console.error('Cannot register connection events - Connection is null');
      return;
    }
    
    console.log('Registering connection events for call:', connection);
    
    // Called when the remote end is ringing
    connection.on('ringing', () => {
      console.log('>>> CONNECTION EVENT: ringing');
      console.log('Connection parameters during ringing:', connection.parameters);
      const callSid = connection.parameters?.CallSid;
      if (callSid) {
        console.log('Call SID during ringing:', callSid);
        setActiveCallSid(callSid);
      }
      setStatus('ringing');
    });
    
    // Called when a call is accepted and establishes connection
    connection.on('accept', () => {
      console.log('>>> CONNECTION EVENT: accept - Call accepted');
      console.log('Full connection object during accept:', connection);
      console.log('Connection parameters during accept:', connection.parameters);
      
      const callSid = connection.parameters?.CallSid;
      if (callSid) {
        console.log('Call SID during accept:', callSid);
        setActiveCallSid(callSid);
      } else {
        console.warn('No CallSid available during accept event');
      }
      
      setStatus('connected');
    });
    
    // Called when a call is disconnected
    connection.on('disconnect', () => {
      console.log('>>> CONNECTION EVENT: disconnect - Call disconnected');
      console.log('Connection parameters during disconnect:', connection.parameters);
      
      setStatus('disconnected');
      setCallerInfo('');
      connectionRef.current = null;
      setActiveCallSid(null);
      setActiveContactId(null);
      // Clear note content when call ends
      setNoteContent('');
    });
    
    // Called when there's a warning or transition state
    connection.on('warning', (warningName: string) => {
      console.warn('>>> CONNECTION EVENT: warning', warningName);
      console.log('Connection parameters during warning:', connection.parameters);
    });
    
    /**
     * Twilio error object (see Twilio Voice JS SDK docs for structure)
     * @param error - Twilio error object, typically has .code and .message
     */
    connection.on('reconnecting', (error: any) => {
      console.warn('>>> CONNECTION EVENT: reconnecting', error);
      console.log('Connection parameters during reconnecting:', connection.parameters);
      setStatus('reconnecting');
    });
    
    /**
     * Twilio error object (see Twilio Voice JS SDK docs for structure)
     * @param error - Twilio error object, typically has .code and .message
     */
    connection.on('error', (error: any) => {
      console.error('>>> CONNECTION EVENT: error', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        info: (error as any).info,
        explanation: (error as any).explanation
      });
      console.log('Connection parameters during error:', connection.parameters);
      
      setError(`Twilio error: ${error.message || 'Unknown error'}`);
      setStatus('error');
      toast({
        title: 'Softphone Error',
        description: error.message || 'An error occurred with the phone connection',
        variant: 'destructive',
      });
    });
  };
  
  // Get status text and color for UI
  const getStatusDetails = () => {
    switch (status) {
      case 'disconnected':
        return { text: 'Ready', color: 'bg-green-500' };
      case 'connecting':
        return { text: 'Connecting...', color: 'bg-yellow-500' };
      case 'connected':
        return { text: 'On Call', color: 'bg-blue-500' };
      case 'incoming':
        return { text: 'Incoming Call', color: 'bg-red-500 animate-pulse' };
      case 'ringing':
        return { text: 'Ringing', color: 'bg-yellow-500' };
      case 'reconnecting':
        return { text: 'Reconnecting...', color: 'bg-orange-500' };
      case 'error':
        return { text: 'Error', color: 'bg-red-500' };
      default:
        return { text: 'Unknown', color: 'bg-gray-500' };
    }
  };

  const statusDetails = getStatusDetails();

  // Mutation for saving notes
  const saveNoteMutation = useMutation({
    mutationFn: (noteData: NewNoteData) => createNoteActivity(noteData),
    onSuccess: (data) => {
      toast({
        title: 'Note Saved',
        description: 'Your note has been saved successfully',
        variant: 'default',
      });
      
      // Clear note content after successful save
      setNoteContent('');
      
      // Invalidate related queries
      if (activeContactId) {
        queryClient.invalidateQueries({ queryKey: ['contactActivities', activeContactId] });
      }
      
      console.log('Note saved successfully:', data);
    },
    onError: (error) => {
      console.error('Error saving note:', error);
      toast({
        title: 'Error Saving Note',
        description: error instanceof Error ? error.message : 'Unknown error saving note',
        variant: 'destructive',
      });
    },
  });

  // Handle saving a note
  const handleSaveNote = () => {
    if (!noteContent.trim()) {
      toast({
        title: 'Note Empty',
        description: 'Please enter some content for your note',
        variant: 'destructive',
      });
      return;
    }
    
    if (!activeContactId) {
      toast({
        title: 'No Contact',
        description: 'Cannot save note: No contact associated with this call',
        variant: 'destructive',
      });
      return;
    }
    
    // Create note data object
    const noteData: NewNoteData = {
      contact_id: activeContactId,
      type: 'note',
      title: 'In-call note',
      description: noteContent,
    };
    
    // Add call_sid if available (as part of the description)
    if (activeCallSid) {
      noteData.description = `${noteData.description}\n\nCall SID: ${activeCallSid}`;
    }
    
    console.log('Saving note:', noteData);
    saveNoteMutation.mutate(noteData);
  };

  // Minimized view of the softphone
  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setMinimized(false)}
          variant="default" 
          size="icon"
          className="rounded-full h-14 w-14 shadow-lg"
        >
          <PhoneIcon className="h-6 w-6" />
          {status === 'connected' && (
            <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-green-500"></span>
          )}
          {status === 'incoming' && (
            <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
          )}
        </Button>
      </div>
    );
  }

  // Handler for making an outbound call
  const handleMakeCall = async () => {
    const audioInit = initializeAudio();
    if (!audioInit) {
      toast({ title: "Audio Error", description: "Could not initialize audio for call.", variant: "destructive" });
      return;
    }
    if (!deviceRef.current || !phoneNumber.trim()) {
      toast({ title: "Call Error", description: "Softphone not ready or no number entered.", variant: "destructive" });
      return;
    }
    const numberToDial = phoneNumber.trim();
    setStatus('connecting');
    try {
      const params = { To: numberToDial };
      console.log("Starting call to:", numberToDial, "with params:", params);
      const callInstance: TwilioCall = await deviceRef.current.connect({ params });
      
      // Log call parameters
      console.log("Call instance created:", callInstance);
      console.log("Call parameters:", callInstance.parameters);
      
      // Save initial CallSid if available, will be updated on accept/connect
      const initialCallSid = callInstance.parameters?.CallSid;
      if (initialCallSid) {
        console.log("Initial call SID captured:", initialCallSid);
        setActiveCallSid(initialCallSid);
      } else {
        console.log("No initial CallSid available, will capture during 'accept' event");
      }
      
      if (callInstance && typeof callInstance.on === 'function') {
        connectionRef.current = callInstance;
        registerConnectionEvents(callInstance);
        
        // For outbound calls, try to look up contact by phone number
        try {
          const contact = await fetchContactByPhone(numberToDial);
          if (contact) {
            setActiveContactId(contact.id);
            setCallerInfo(`${contact.first_name} ${contact.last_name} (${numberToDial})`);
            console.log('Contact found for outbound call:', contact);
          } else {
            setActiveContactId(null);
            console.log('No contact found for outbound call to:', numberToDial);
          }
        } catch (lookupError) {
          console.error('Error looking up contact for outbound call:', lookupError);
          setActiveContactId(null);
        }
      } else {
        setError('Failed to properly initiate call connection object.');
        setStatus('error');
        toast({ title: "Call Setup Error", description: "Could not set up call events.", variant: "destructive"});
      }
    } catch (err: any) {
      console.error("Error in handleMakeCall:", err);
      setError(`Error placing call: ${err?.message || 'Unknown SDK error'}`);
      setStatus('error');
      toast({
        title: 'Outbound Call Error',
        description: err?.message || `Could not place call to ${numberToDial}.`,
        variant: 'destructive',
      });
    }
  };

  // Handler for accepting an incoming call
  const handleAcceptCall = () => {
    initializeAudio();
    if (connectionRef.current) {
      connectionRef.current.accept();
      setStatus('connected');
    } else {
      console.error('No connection to accept!');
    }
  };

  // Handler for rejecting or ending a call
  const handleRejectOrEndCall = () => {
    if (connectionRef.current) {
      connectionRef.current.disconnect();
    } else if (deviceRef.current) {
      deviceRef.current.disconnectAll();
    }
    setStatus('disconnected');
    setCallerInfo('');
    // Clear note content when call ends
    setNoteContent('');
  };

  // Full softphone view
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-lg">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-md font-medium">Softphone</CardTitle>
          <div className="flex space-x-1">
            <Badge variant="outline" className={`${statusDetails.color} text-white px-2 py-0.5 text-xs`}>
              {statusDetails.text}
            </Badge>
            <Button 
              onClick={() => setMinimized(true)} 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-2 space-y-3">
          {/* Initialize Audio Button - Always show if not initialized */}
          {!audioInitialized && (
            <Button
              onClick={initializeAudio}
              variant="outline"
              size="sm"
              className="w-full mb-2"
            >
              <VolumeIcon className="h-4 w-4 mr-1" />
              Initialize Audio
            </Button>
          )}
          
          {/* Show caller info when relevant */}
          {(status === 'incoming' || status === 'connected') && callerInfo && (
            <div className="text-center font-medium">
              {status === 'incoming' ? 'Incoming call from:' : 'Connected with:'}
              <div className="text-lg">{callerInfo}</div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="text-sm text-red-500 mt-1">{error}</div>
          )}
          
          {/* Phone number input for outbound calls - only show when not on a call */}
          {status === 'disconnected' && (
            <div className="flex space-x-2">
              <Input
                type="tel"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleMakeCall} 
                disabled={!isReady || !phoneNumber}
                size="sm"
              >
                <PhoneIcon className="h-4 w-4 mr-1" />
                Call
              </Button>
            </div>
          )}
          
          {/* Debug display for active call info */}
          {status === 'connected' && (
            <div className="text-xs text-gray-500 mb-2">
              <p>Call SID: {activeCallSid || 'N/A'}</p>
              <p>Contact ID: {activeContactId || 'N/A'}</p>
            </div>
          )}
          
          {/* Note-taking area - only show during active calls */}
          {status === 'connected' && (
            <div className="space-y-2">
              <Textarea
                placeholder="Type call notes here..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
                className="w-full resize-none"
              />
              <Button
                onClick={handleSaveNote}
                disabled={!noteContent.trim() || !activeContactId || saveNoteMutation.isPending}
                size="sm"
                className="w-full"
                variant="outline"
              >
                <Save className="h-4 w-4 mr-1" />
                {saveNoteMutation.isPending ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex justify-center">
          {/* Show different buttons based on call status */}
          {status === 'incoming' && (
            <div className="flex space-x-2 w-full">
              <Button 
                onClick={handleAcceptCall}
                variant="default" 
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <PhoneIncomingIcon className="h-4 w-4 mr-1" />
                Answer
              </Button>
              <Button 
                onClick={handleRejectOrEndCall}
                variant="destructive" 
                className="flex-1"
              >
                <PhoneOffIcon className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
          
          {(status === 'connected' || status === 'connecting' || status === 'reconnecting') && (
            <Button 
              onClick={handleRejectOrEndCall}
              variant="destructive" 
              className="w-full"
            >
              <PhoneOffIcon className="h-4 w-4 mr-1" />
              Hang Up
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Softphone;