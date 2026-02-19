const SQL_KEYWORDS = [
  "SELECT","FROM","WHERE","JOIN","LEFT","RIGHT","INNER","OUTER","ON","AS",
  "INSERT","INTO","VALUES","UPDATE","SET","DELETE","CREATE","TABLE","INDEX",
  "DROP","ALTER","ADD","COLUMN","PRIMARY","KEY","FOREIGN","REFERENCES",
  "GROUP BY","ORDER BY","HAVING","LIMIT","OFFSET","DISTINCT","UNION","ALL",
  "AND","OR","NOT","IN","EXISTS","BETWEEN","LIKE","IS","NULL","TRUE","FALSE",
  "CASE","WHEN","THEN","ELSE","END","WITH","CTE","RETURNING","EXPLAIN",
];

export function formatSQL(input: string): string {
  if (!input.trim()) return "";

  let result = input
    .replace(/\s+/g, " ")
    .trim();

  // Add newlines before major clauses
  const clauses = [
    "SELECT", "FROM", "WHERE", "JOIN", "LEFT JOIN", "RIGHT JOIN",
    "INNER JOIN", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "UNION",
    "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM", "WITH",
  ];

  clauses.forEach((clause) => {
    const regex = new RegExp(`\\b${clause}\\b`, "gi");
    result = result.replace(regex, `\n${clause}`);
  });

  // Indent fields in SELECT
  result = result.replace(/SELECT\s+(.*?)\s+FROM/is, (_, fields) => {
    const fieldList = fields
      .split(",")
      .map((f: string) => `  ${f.trim()}`)
      .join(",\n");
    return `SELECT\n${fieldList}\nFROM`;
  });

  // Uppercase keywords
  SQL_KEYWORDS.forEach((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, "gi");
    result = result.replace(regex, kw);
  });

  return result.trim();
}
