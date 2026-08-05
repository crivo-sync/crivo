"use client";

import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import type { ImportRowIssue } from "../../types";

type IssueListProps = {
  title: string;
  issues: ImportRowIssue[];
  severity: "warning" | "error";
};

/**
 * Lista recolhida: numa planilha grande as pendências passam de cem, e
 * despejá-las abertas empurraria a prévia — que é o que precisa ser conferido
 * — para fora da tela.
 */
export const IssueList = ({ title, issues, severity }: IssueListProps) => {
  if (issues.length === 0) return null;

  return (
    <Accordion disableGutters variant="outlined">
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2" color={`${severity}.main`}>
          {title} ({issues.length})
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ maxHeight: 220, overflowY: "auto", p: 0 }}>
        <List dense disablePadding>
          {issues.map((issue) => (
            <ListItem key={issue.line} divider>
              <ListItemText
                primary={`Linha ${issue.line}${issue.name ? ` — ${issue.name}` : ""}`}
                secondary={issue.message}
              />
            </ListItem>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
};
