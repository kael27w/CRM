import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreVertical, Phone, Mail, MapPin, Briefcase } from 'lucide-react';
import { Client } from '@/types';

interface ClientCardProps {
  client: Client;
  onClick?: () => void;
  onContact?: () => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onClick, onContact }) => {
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow relative"
      onClick={onClick}
    >
      {/* Status badge positioned absolutely in the top-right corner */}
      <Badge 
        variant={client.status === 'active' ? 'default' : 'secondary'}
        className={`absolute top-2 right-2 z-10 ${
          client.status === 'active' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
            : ''
        }`}
      >
        {client.status}
      </Badge>

      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          {/* Header with avatar and name */}
          <div className="flex items-center">
            <Avatar className="h-14 w-14">
              <AvatarImage src={client.profileImage} alt={client.name} />
              <AvatarFallback>
                {client.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4">
              <h3 className="text-base font-medium text-slate-900 dark:text-white">{client.name}</h3>
              {client.occupation && (
                <div className="flex items-center mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <Briefcase className="h-3 w-3 mr-1" />
                  <span>{client.occupation}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Contact information in separate rows */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {client.email && (
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                <Mail className="h-3 w-3 mr-2 flex-shrink-0" />
                <span className="truncate">{client.email}</span>
              </div>
            )}
            
            {client.phone && (
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                <Phone className="h-3 w-3 mr-2 flex-shrink-0" />
                <span>{client.phone}</span>
              </div>
            )}
            
            {client.address && (
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="h-3 w-3 mr-2 flex-shrink-0" />
                <span className="truncate">{client.address}</span>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-between items-center pt-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onContact && onContact();
              }}
            >
              Contact
            </Button>
            <Button 
              size="icon" 
              variant="ghost"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientCard;
