import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreVertical, Phone, Mail } from 'lucide-react';
import { Client } from '@/types';

interface ClientCardProps {
  client: Client;
  onClick?: () => void;
  onContact?: () => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onClick, onContact }) => {
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center">
          <Avatar className="h-12 w-12">
            <AvatarImage src={client.profileImage} alt={client.name} />
            <AvatarFallback>
              {client.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white">{client.name}</h3>
              <Badge 
                variant={client.status === 'active' ? 'success' : 'secondary'}
                className={
                  client.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                    : ''
                }
              >
                {client.status}
              </Badge>
            </div>
            <div className="mt-1 flex items-center text-xs text-slate-500 dark:text-slate-400">
              {client.email && (
                <span className="flex items-center mr-3">
                  <Mail className="h-3 w-3 mr-1" />
                  {client.email}
                </span>
              )}
              {client.phone && (
                <span className="flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  {client.phone}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-between items-center">
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
      </CardContent>
    </Card>
  );
};

export default ClientCard;
