// @flow
import React, { useState, useEffect } from "react";
import Typography from "@material-ui/core/Typography";
import Alert from "@material-ui/lab/Alert";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import MarkdownRenderer from "../commons/MarkdownRenderer";
import activitiesService from "../../services/activitiesService";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
  borderPrimary: {
    border: `1px solid ${theme.palette.text.primary}`,
  },
  summaryText: {
    color: theme.palette.text.primary,
    fontWeight: "bold",
  },
  mdDescription: {
    "& .markdown-body pre": {
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.text.primary,
    },
    "& .markdown-body code": {
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.text.primary,
    },
    "& .markdown-body table tr": {
      backgroundColor: theme.palette.background.default,
    },
    "& .markdown-body table tr:nth-child(2n)": {
      backgroundColor: theme.palette.action.hover,
    }
  },
});


type Props = {
  courseId: number,
  activityId: number,
  classes: any,
};

const ActivityDescriptionAccordion = (props: Props) => {
  const { courseId, activityId, classes } = props;

  const [content, setContent] = useState("");
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await activitiesService.getActivityForStudent(courseId, activityId);
        setContent(res.description);
      } catch (err) {
        setError(true);
      }
    };

    fetchActivity();
  }, [courseId, activityId]);

  const handleExpanded = (event: Event, isExpanded: boolean) => {
    setExpanded(isExpanded);
  };

  const renderContent = () => {
    if (error) {
      return (
        <Alert severity="error">
          Parece que hubo un error al intentar cargar el enunciado. :/
        </Alert>
      );
    }

    return (
      <div className={classes.mdDescription}>
        <MarkdownRenderer content={content} />
      </div>
    );    
  };

  return (
    <Accordion 
      expanded={expanded} 
      onChange={handleExpanded}
      className={classes.borderPrimary}
    >
      <AccordionSummary
        id="activity-description-header"
        aria-controls="activity-description-content"
        expandIcon={<ExpandMoreIcon />}
      >
        <Typography variant="h5" component="p" className={classes.summaryText}>
          Enunciado
        </Typography>
      </AccordionSummary>
      <AccordionDetails>{renderContent()}</AccordionDetails>
    </Accordion>
  );
};

export default withStyles(styles)(ActivityDescriptionAccordion);
