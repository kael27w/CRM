import React, { useState, useEffect, useRef } from 'react';
import type { Device } from '@twilio/voice-sdk';
// Remove the Connection import
import { fetchTwilioToken } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PhoneIcon, PhoneOffIcon, PhoneIncomingIcon, XIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

// Then create a type alias for Connection
type Connection = any;

// Define interface for Twilio error object
interface TwilioError {
  message?: string;
  code?: number;
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
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<CallStatus>('disconnected');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callerInfo, setCallerInfo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);

  // Initialize the Twilio Device on component mount
  useEffect(() => {
    let mounted = true;
    let Device: any;
    
    // Dynamically import the Twilio Voice SDK
    const loadTwilioSDK = async () => {
      try {
        const twilioVoice = await import('@twilio/voice-sdk');
        Device = twilioVoice.Device;
        await setupDevice();
      } catch (err) {
        console.error('Error loading Twilio Voice SDK:', err);
        setError('Failed to load Twilio Voice SDK. Please make sure it is installed.');
        toast({
          title: 'Softphone Error',
          description: 'Failed to load Twilio Voice SDK',
          variant: 'destructive',
        });
      }
    };
    
    const setupDevice = async () => {
      try {
        // Fetch token from backend
        const { token } = await fetchTwilioToken();
        console.log('Twilio token received, initializing Device');
        
        // Create a new Device instance with the token
        if (mounted && Device) {
          if (deviceRef.current) {
            console.log('Destroying existing Device');
            deviceRef.current.destroy();
          }
          
          // Initialize new Device
          deviceRef.current = new Device(token, {
            logLevel: 'info',
            // Add other options as needed
          });
          
          // Register event handlers
          registerDeviceEvents();
          
          // Mark as ready
          setIsReady(true);
          setError(null);
          console.log('Twilio Device initialized successfully');
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Twilio Device';
          console.error('Error initializing Twilio Device:', err);
          setError(errorMessage);
          toast({
            title: 'Softphone Error',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      }
    };
    
    loadTwilioSDK();
    
    // Cleanup function
    return () => {
      mounted = false;
      if (deviceRef.current) {
        console.log('Component unmounting, destroying Twilio Device');
        deviceRef.current.destroy();
        deviceRef.current = null;
      }
    };
  }, []);
  
  // Register event handlers for the Twilio Device
  const registerDeviceEvents = () => {
    if (!deviceRef.current) return;
    
    // Called when the Device is registered and ready to make/receive calls
    deviceRef.current.on('registered', () => {
      console.log('Twilio Device registered');
      setStatus('disconnected');
      setIsReady(true);
    });
    
    // Called when the Device fails to register
    deviceRef.current.on('error', (twilioError: TwilioError) => {
      console.error('Twilio Device error:', twilioError);
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
      console.log('Incoming call', connection);
      connectionRef.current = connection;
      
      // Get caller information (phone number)
      const from = connection.parameters.From || 'Unknown caller';
      setCallerInfo(from);
      setStatus('incoming');
      
      // Play a sound to alert the user (you could add a sound file here)
      // new Audio('/sounds/incoming-call.mp3').play().catch(e => console.error('Error playing sound:', e));
      
      toast({
        title: 'Incoming Call',
        description: `Call from ${from}`,
        variant: 'default',
      });
      
      // Handle connection events
      registerConnectionEvents(connection);
    });
  };
  
  // Register event handlers for a specific call connection
  const registerConnectionEvents = (connection: Connection) => {
    // Called when a call is accepted and establishes connection
    connection.on('accept', () => {
      console.log('Call accepted');
      setStatus('connected');
    });
    
    // Called when a call is disconnected
    connection.on('disconnect', () => {
      console.log('Call disconnected');
      setStatus('disconnected');
      setCallerInfo('');
      connectionRef.current = null;
    });
    
    // Called when there's a warning or transition state
    connection.on('warning', (warningName: string) => {
      console.warn('Call warning:', warningName);
    });
    
    // Called when a call is reconnecting 
    connection.on('reconnecting', (error: TwilioError) => {
      console.warn('Call reconnecting:', error);
      setStatus('reconnecting');
    });
    
    // Called on various errors
    connection.on('error', (error: TwilioError) => {
      console.error('Call error:', error);
      setError(`Call error: ${error?.message || 'Unknown error'}`);
      setStatus('error');
      toast({
        title: 'Call Error',
        description: error?.message || 'An error occurred during the call',
        variant: 'destructive',
      });
    });
  };
  
  // Handler for accepting an incoming call
  const handleAcceptCall = () => {
    if (connectionRef.current) {
      console.log('Accepting incoming call');
      connectionRef.current.accept();
      setStatus('connected');
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
    }
    setStatus('disconnected');
    setCallerInfo('');
  };
  
  // Handler for making an outbound call
  const handleMakeCall = () => {
    if (!deviceRef.current || !phoneNumber) return;
    
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
      
      // Initiate the call
      const connection = deviceRef.current.connect({ params });
      connectionRef.current = connection;
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