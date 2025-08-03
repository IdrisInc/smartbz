import React, { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useOrganization } from '@/contexts/OrganizationContext';
import { CreateOrganizationDialog } from './CreateOrganizationDialog';

export function OrganizationSelector() {
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { currentOrganization, organizations, switchOrganization } = useOrganization();

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[250px] justify-between"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="truncate">
                {currentOrganization ? currentOrganization.name : "Select organization..."}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Search organizations..." />
            <CommandList>
              <CommandEmpty>No organizations found.</CommandEmpty>
              <CommandGroup>
                {organizations.map((org) => (
                  <CommandItem
                    key={org.id}
                    value={org.id}
                    onSelect={() => {
                      switchOrganization(org.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentOrganization?.id === org.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{org.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {org.business_sector} • {org.subscription_plan}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setShowCreateDialog(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new organization
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateOrganizationDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}