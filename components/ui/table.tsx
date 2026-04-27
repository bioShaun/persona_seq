import * as React from "react";
import { cn } from "@/lib/utils";

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto"><table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} /></div>
));
Table.displayName = "Table";
export const TableHeader = (props: React.HTMLAttributes<HTMLTableSectionElement>) => <thead className="[&_tr]:border-b" {...props} />;
export const TableBody = (props: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody className="[&_tr:last-child]:border-0" {...props} />;
export const TableFooter = (props: React.HTMLAttributes<HTMLTableSectionElement>) => <tfoot className="border-t bg-muted/50 font-medium" {...props} />;
export const TableRow = (props: React.HTMLAttributes<HTMLTableRowElement>) => <tr className="border-b transition-colors hover:bg-muted/50" {...props} />;
export const TableHead = (props: React.ThHTMLAttributes<HTMLTableCellElement>) => <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground" {...props} />;
export const TableCell = (props: React.TdHTMLAttributes<HTMLTableCellElement>) => <td className="p-2 align-middle" {...props} />;
export const TableCaption = (props: React.HTMLAttributes<HTMLTableCaptionElement>) => <caption className="mt-4 text-sm text-muted-foreground" {...props} />;
