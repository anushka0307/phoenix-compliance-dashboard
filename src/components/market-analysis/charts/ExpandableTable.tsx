interface ExpandableTableProps {
  title: string;
  headers: string[];
  rows: string[][];
}

export function ExpandableTable({ title, headers, rows }: ExpandableTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <h4 className="border-b border-border px-4 py-3 text-sm font-medium text-foreground">
        {title}
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
              {headers.map((header) => (
                <th key={header} className="px-4 py-2 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border/60 last:border-0">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-2.5 text-muted-foreground">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
