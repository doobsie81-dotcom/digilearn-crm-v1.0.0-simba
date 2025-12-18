'use client';

import { Search } from "lucide-react";
import { Input } from "./input";

const SearchInput = (props: React.ComponentProps<"input">) => {
    return (<div className="relative w-full max-w-xs">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        className="pl-9"
        aria-label="Search leads"
        {...props}
      />
    </div>
    );
}

export default SearchInput; 