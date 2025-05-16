import React, { useState, useEffect, useRef } from 'react';
import { Device } from '@twilio/voice-sdk';
import { fetchTwilioToken } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PhoneIcon, PhoneOffIcon, PhoneIncomingIcon, XIcon, VolumeIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

// Define a type for Connection since it might not be directly importable
type Connection = any;

// Define interface for Twilio error object
interface TwilioError {
  message?: string;
  code?: number;
  explanation?: string;
  info?: any;
  [key: string]: any;
}

/**
 * Status values for the Softphone
 */
type CallStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'incoming' 
  | 'reconnecting'
  | 'error';

/**
 * Softphone component for handling browser-based calls using Twilio Voice SDK
 */
const Softphone: React.FC = () => {
  // References and state
  const deviceRef = useRef<Device | null>(null);
  const connectionRef = useRef<Connection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<CallStatus>('disconnected');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callerInfo, setCallerInfo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);

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
        registered: isReady, // Use our component state instead
        deviceExists: !!deviceRef.current
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
      console.log('Device Registration Details:', {
        identity: 'agent1',
        token: token.substring(0, 20) + '...',  // Log partial token for debugging
        deviceRegistered: isReady,
        deviceExists: !!deviceRef.current,
      });
    });
    
    // Called when the Device fails to register
    deviceRef.current.on('error', (twilioError: TwilioError) => {
      console.error('>>> DEVICE EVENT: error', twilioError);
      console.error('Error details:', {
        code: twilioError.code,
        message: twilioError.message,
        info: twilioError.info,
        explanation: twilioError.explanation
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
    deviceRef.current.on('incoming', (connection: Connection) => {
      // Immediate logging first for debugging
      console.log('>>> DEVICE EVENT: incoming', connection);
      console.log('Connection parameters:', connection.parameters);
      
      // Immediate visual feedback for testing
      document.body.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
      setTimeout(() => {
        document.body.style.backgroundColor = '';
      }, 5000); // Reset after 5 seconds
      
      console.log('From:', connection.parameters.From);
      console.log('To:', connection.parameters.To);
      console.log('Direction:', connection.parameters.Direction);
      console.log('CallSid:', connection.parameters.CallSid);
      
      connectionRef.current = connection;
      
      // Get caller information (phone number)
      const from = connection.parameters.From || 'Unknown caller';
      setCallerInfo(from);
      console.log(`Setting status to "incoming" for call from ${from}`);
      setStatus('incoming');
      
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
    deviceRef.current.on('connect', (connection: Connection) => {
      console.log('>>> DEVICE EVENT: connect - Successfully established call', connection);
      connectionRef.current = connection;
      registerConnectionEvents(connection);
    });
    
    deviceRef.current.on('disconnect', (connection: Connection) => {
      console.log('>>> DEVICE EVENT: disconnect - Call ended', connection);
      connectionRef.current = null;
      setStatus('disconnected');
      setCallerInfo('');
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
  const registerConnectionEvents = (connection: Connection) => {
    if (!connection) {
      console.error('Cannot register connection events - Connection is null');
      return;
    }
    
    // Called when a call is accepted and establishes connection
    connection.on('accept', () => {
      console.log('>>> CONNECTION EVENT: accept - Call accepted');
      setStatus('connected');
    });
    
    // Called when a call is disconnected
    connection.on('disconnect', () => {
      console.log('>>> CONNECTION EVENT: disconnect - Call disconnected');
      setStatus('disconnected');
      setCallerInfo('');
      connectionRef.current = null;
    });
    
    // Called when there's a warning or transition state
    connection.on('warning', (warningName: string) => {
      console.warn('>>> CONNECTION EVENT: warning', warningName);
    });
    
    // Called when a call is reconnecting 
    connection.on('reconnecting', (error: TwilioError) => {
      console.warn('>>> CONNECTION EVENT: reconnecting', error);
      setStatus('reconnecting');
    });
    
    // Called on various errors
    connection.on('error', (error: TwilioError) => {
      console.error('>>> CONNECTION EVENT: error', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        info: error.info,
        explanation: error.explanation
      });
      
      setError(`Call error: ${error?.message || 'Unknown error'}`);
      setStatus('error');
      toast({
        title: 'Call Error',
        description: error?.message || 'An error occurred during the call',
        variant: 'destructive',
      });
    });
    
    // Additional connection events
    connection.on('reject', () => {
      console.log('>>> CONNECTION EVENT: reject - Call was rejected');
      setStatus('disconnected');
      setCallerInfo('');
      connectionRef.current = null;
    });
    
    connection.on('cancel', () => {
      console.log('>>> CONNECTION EVENT: cancel - Call was cancelled');
      setStatus('disconnected');
      setCallerInfo('');
      connectionRef.current = null;
    });
    
    connection.on('mute', (isMuted: boolean) => {
      console.log(`>>> CONNECTION EVENT: mute - Call ${isMuted ? 'muted' : 'unmuted'}`);
    });
    
    // These events might not exist in all versions
    try {
      connection.on('volume', (inputVolume: number, outputVolume: number) => {
        console.log(`>>> CONNECTION EVENT: volume - Input: ${inputVolume}, Output: ${outputVolume}`);
      });
      
      connection.on('ringing', () => {
        console.log('>>> CONNECTION EVENT: ringing - Call is ringing');
      });
    } catch (e) {
      console.log('Some connection events are not supported in this version');
    }
  };
  
  // Handler for initializing audio context (can be triggered by user gesture)
  const handleInitializeAudio = () => {
    const success = initializeAudio();
    if (success) {
      toast({
        title: 'Audio Initialized',
        description: 'Audio system is ready for calls',
        variant: 'default',
      });
    } else {
      toast({
        title: 'Audio Error',
        description: 'Failed to initialize audio system',
        variant: 'destructive',
      });
    }
  };
  
  // Handler for accepting an incoming call
  const handleAcceptCall = () => {
    // Ensure audio is initialized before accepting
    initializeAudio();
    
    if (connectionRef.current) {
      console.log('Accepting incoming call');
      connectionRef.current.accept();
      setStatus('connected');
    } else {
      console.error('No connection to accept!');
    }
  };
  
  // Handler for rejecting or ending a call
  const handleRejectOrEndCall = () => {
    if (connectionRef.current) {
      console.log('Rejecting/ending call');
      connectionRef.current.disconnect();
    } else if (deviceRef.current) {
      console.log('No active connection, disconnecting any device connections');
      deviceRef.current.disconnectAll();
    } else {
      console.error('No connection or device to disconnect!');
    }
    setStatus('disconnected');
    setCallerInfo('');
  };
  
  // Handler for making an outbound call
  const handleMakeCall = () => {
    // Ensure audio is initialized before making a call
    initializeAudio();
    
    if (!deviceRef.current || !phoneNumber) {
      console.error('Cannot make call: Device not ready or phone number empty');
      return;
    }
    
    try {
      console.log(`Making outbound call to: ${phoneNumber}`);
      setStatus('connecting');
      
      // Format phone number if necessary
      let formattedNumber = phoneNumber.trim();
      
      // Call params for outbound call
      const params = {
        To: formattedNumber, 
        // Any additional parameters needed
      };
      
      console.log('Connecting with params:', params);
      // Initiate the call
      const connection = deviceRef.current.connect({ params });
      connectionRef.current = connection;
      console.log('Call connection initiated, registering connection events');
      registerConnectionEvents(connection);
      
    } catch (err) {
      console.error('Error placing call:', err);
      setError(`Error placing call: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus('error');
      toast({
        title: 'Call Error',
        description: `Could not place call to ${phoneNumber}`,
        variant: 'destructive',
      });
    }
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
      case 'reconnecting':
        return { text: 'Reconnecting...', color: 'bg-orange-500' };
      case 'error':
        return { text: 'Error', color: 'bg-red-500' };
      default:
        return { text: 'Unknown', color: 'bg-gray-500' };
    }
  };
  
  const statusDetails = getStatusDetails();
  
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
              onClick={handleInitializeAudio}
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