import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";

const Command = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className="flex h-full w-full flex-col overflow-hidden rounded-lg bg-white"
    {...props}
  />
));
Command.displayName = "Command";

const CommandInput = React.forwardRef(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3">
    <CommandPrimitive.Input
      ref={ref}
      className="flex h-10 w-full rounded-md bg-transparent py-3 outline-none placeholder:text-gray-500"
      {...props}
    />
  </div>
));
CommandInput.displayName = "CommandInput";

const CommandEmpty = React.forwardRef((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm text-gray-600"
    {...props}
  />
));
CommandEmpty.displayName = "CommandEmpty";

const CommandGroup = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className="overflow-hidden p-1 text-gray-950"
    {...props}
  />
));
CommandGroup.displayName = "CommandGroup";

const CommandItem = React.forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900"
    {...props}
  />
));
CommandItem.displayName = "CommandItem";

export { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem };