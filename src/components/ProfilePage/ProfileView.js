import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Avatar from "@material-ui/core/Avatar";
import Grid from "@material-ui/core/Grid";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import EditIcon from "@material-ui/icons/Edit";
import { withState } from "../../utils/State";

const styles = theme => ({
  root: {
    maxWidth: "60%",
    margin: "auto",
    marginTop: theme.spacing(4),
    [theme.breakpoints.down("md")]: {
      maxWidth: "100%",
      marginTop: theme.spacing(2),
    },
  },
  avatar: {
    width: theme.spacing(26),
    height: theme.spacing(26),
    fontSize: theme.spacing(7),
    margin: "auto",
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down("md")]: {
      width: theme.spacing(20),
      height: theme.spacing(20),
      fontSize: theme.spacing(5),
    },
  },
  info: {
    marginBottom: theme.spacing(1),
    wordBreak: "break-word",
  },
  editButton: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: theme.spacing(2),
  },
});

class ProfileView extends React.Component {
  render() {
    const { profile, classes, onClickEdit } = this.props;
    return (
      <Card className={classes.root} elevation={3}>
        <div className={classes.editButton}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={onClickEdit}
          >
            Editar Perfil
          </Button>
        </div>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Avatar src={profile.img_uri} className={classes.avatar}>
                {profile.name[0]}
                {profile.surname[0]}
              </Avatar>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography className={classes.info} variant="h6">{`Usuario:  ${profile.username}`}</Typography>
              <Typography className={classes.info} variant="body1">{`Nombre:  ${profile.name}`}</Typography>
              <Typography className={classes.info} variant="body1">{`Apellido:  ${profile.surname}`}</Typography>
              <Typography className={classes.info} variant="body1">{`Padrón:  ${profile.student_id}`}</Typography>
              <Typography className={classes.info} variant="body1">{`Email:  ${profile.email}`}</Typography>
              <Typography className={classes.info} variant="body1">{`Universidad:  ${profile.university}`}</Typography>
              <Typography className={classes.info} variant="body1">{`Carrera:  ${profile.degree}`}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }
}

export default withState(withStyles(styles)(ProfileView));