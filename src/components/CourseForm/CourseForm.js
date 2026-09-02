// @flow
import React from "react";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import Grid from "@material-ui/core/Grid";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import WarningIcon from '@material-ui/icons/Warning';
import TextField from "@material-ui/core/TextField";
import { withStyles } from "@material-ui/core/styles";
import Autocomplete from "@material-ui/lab/Autocomplete";
import DateFnsUtils from "@date-io/date-fns";
import { MuiPickersUtilsProvider, KeyboardDatePicker } from "@material-ui/pickers";
import { DropzoneArea } from "material-ui-dropzone";
import { withState } from "../../utils/State";
import ErrorNotification from "../../utils/ErrorNotification";
import coursesService from "../../services/coursesService";
import usersService from "../../services/usersService";
import cloudinaryService from "../../services/cloudinaryService";
import { validate } from "../../utils/inputValidator";
import authenticationService from "../../services/authenticationService";
import type { Course } from "../../types";

const styles = theme => ({
  root: {
    maxWidth: "60%",
    margin: "auto",
    marginTop: theme.spacing(4),
    [theme.breakpoints.down("md")]: {
      maxWidth: "100%",
      marginTop: theme.spacing(2),
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
    },
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
  },
  form: {
    marginTop: theme.spacing(1),
    width: "100%",
    padding: `0px ${theme.spacing(2)}px`,
  },
  cancelButton: {
    display: "flex",
    marginRight: theme.spacing(1),
    marginLeft: 0,
    marginTop: theme.spacing(3),
  },
  createButton: {
    display: "flex",
    marginLeft: 0,
    marginRight: 0,
    marginTop: theme.spacing(3),
  },
  semesterFields: {
    alignItems: "center",
    justifyContent: "center",
  },
  waitingDialog: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  switchFields: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    "& .MuiSwitch-track": {
      backgroundColor: theme.palette.grey[500],
    },
  },
  deletionSwitch: {
    marginLeft: theme.spacing(5),
  },
  dropzoneContainer: {
    marginTop: theme.spacing(2),
    border: `1px dashed ${theme.palette.text.primary}`,
    borderRadius: theme.spacing(1),
    height: "180px",
    overflow: "hidden",
  },
});

type Props = {
  classes: any,
  history: any,
  course: ?Course,
  cloneMode: boolean,
  editMode: boolean,
};

type State = {
  error: { open: boolean, message: ?string, invalidFields: any },
  name: string,
  university: any,
  subjectId: string,
  semester: string,
  description: string,
  courseAdminUserId: string,
  semesterEnd: Date,
  semesterStart: Date,
  users: Array<any>,
  imgUri: string,
  universities: Array<any>,
  waiting: boolean,
  isCourseFinished: boolean,
  courseMarkedForDeletion: boolean,
  pendingConfirmationForFinished: boolean,
  pendingConfirmationForDeletion: boolean,
};

class CourseForm extends React.Component<Props, State> {
  state = {
    error: { open: false, message: null, invalidFields: new Set() },
    name: "",
    university: undefined,
    subjectId: "",
    semester: "",
    semesterStart: new Date(),
    semesterEnd: new Date(),
    description: "",
    courseAdminUserId: "",
    courseImg: undefined,
    imgUri: "",
    users: [],
    universities: [],
    waiting: false,
    isCourseFinished: false,
    courseMarkedForDeletion: false,
    pendingConfirmationForFinished: false,
    pendingConfirmationForDeletion: false,
  };

  userSearchDebounceTimer: ?TimeoutID = null;

  componentDidMount() {
    const { course } = this.props;
    authenticationService.getUniversities().then(universities => {
      this.setState({ universities });
      if (!course) {
        // Set default university to FIUBA
        const fiubaUniversity = universities.find(uni => uni.name === "FIUBA");
        if (fiubaUniversity) {
          this.setState({ university: fiubaUniversity });
        }
        return this.loadUsers("");
      }
      this.updateFillCourseFields(course);
    });
  }

  componentDidUpdate(prevProps) {
    const { course } = this.props;

    if (course !== prevProps.course) {
      this.updateFillCourseFields(course);
    }
  }

  updateFillCourseFields(course) {
    const { universities } = this.state;
    this.setState({
      name: course.name,
      university: universities.find(university => university.name === course.university),
      subjectId: course.subject_id,
      semester: course.semester,
      semesterStart: new Date(course.semester_start_date),
      semesterEnd: new Date(course.semester_end_date),
      imgUri: course.img_uri,
      description: course.description,
      isCourseFinished: !course.active || false,
      courseMarkedForDeletion: course.deleted || false,
    });
  }

  loadUsers(query) {
    return usersService.findUsers(query).then(users => {
      this.setState({ users });
    }).catch(() => {
      this.setState({
        users: [],
        error: {
          open: true,
          message: "Hubo un error al obtener los usuarios, Por favor reintenta",
          invalidFields: new Set(),
        },
      });
    });
  }

  loadUsersOnInput(query) {
    if (this.userSearchDebounceTimer) {
      clearTimeout(this.userSearchDebounceTimer);
    }
    this.userSearchDebounceTimer = setTimeout(() => {
      this.loadUsers(query);
    }, 300);
  }


  handleChange(event, valid) {
    event.persist();
    // Close error message
    this.setState(prevState => {
      const { invalidFields } = prevState.error;
      if (valid && invalidFields.has(event.target.id)) {
        invalidFields.delete(event.target.id);
      } else if (!valid) {
        invalidFields.add(event.target.id);
      }
      return {
        [event.target.id]: event.target.value,
        error: { open: false, message: "", invalidFields },
      };
    });
  }

  handleToggleFinish = (event, checked) => {
    if (checked) {
      this.setState({ pendingConfirmationForFinished: true });
    } else {
      this.setState({ isCourseFinished: false });
    }
  };

  handleConfirmFinish = () => {
    this.setState({ 
      isCourseFinished: true, 
      pendingConfirmationForFinished: false 
    });
  };

  handleCancelFinish = () => {
    this.setState({ 
      pendingConfirmationForFinished: false, isCourseFinished: false
    });
  };

  handleToggleDelete = (event, checked) => {
    if (checked) {
      this.setState({ 
        pendingConfirmationForDeletion: true 
      });
    } else {
      this.setState({ courseMarkedForDeletion: false });
    }
  };

  handleConfirmDelete = () => {
    this.setState({ 
      courseMarkedForDeletion: true, 
      pendingConfirmationForDeletion: false 
    });
  };

  handleCancelDelete = () => {
    this.setState({ 
      pendingConfirmationForDeletion: false,
      courseMarkedForDeletion: false 
    });
  };

  handleCancelClick(event) {
    event.preventDefault();
    const { course } = this.props;
    if (course && course.id) {
      this.props.history.push(`/courses/${course.id}/dashboard`);
    } else {
      this.props.history.push("/courses");
    }
  }

  handleCloneClick(event) {
    event.preventDefault();
    const {
      name,
      university,
      subjectId: subjectId,
      semester,
      semesterStart,
      semesterEnd,
      description,
      courseAdminUserId,
      courseImg,
      imgUri,
      error
    } = this.state;

    const { course } = this.props;
    const { id } = course;

    if (error.invalidFields.size !== 0 || !university) {
      this.setState(prevState => ({
        error: {
          open: true,
          message: "El formulario cuenta con campos invalidos",
          invalidFields: prevState.error.invalidFields,
        },
      }));
      return;
    }

    let courseImgPromise = Promise.resolve();
    if (imgUri !== course.img_uri && courseImg !== null) {
      courseImgPromise = cloudinaryService.uploadFile(courseImg);
    }
    courseImgPromise
      .then(courseImgAsset => {
        return coursesService.clone(
          id,
          name,
          university.name,
          subjectId,
          semester,
          semesterStart.toLocaleDateString("sv-SE"),
          semesterEnd.toLocaleDateString("sv-SE"),
          courseAdminUserId,
          description,
          (courseImgAsset && courseImgAsset.url) || imgUri
        );
      })
      .then(() => {
        this.props.history.push("/courses");
      })
      .catch(err => {
        console.log(err);
        this.setState(prevState => ({
          error: {
            open: true,
            message:
              "Hubo un error al clonar el curso, revisa que los datos ingresados sean validos. Chequea la consola para más detalle",
            invalidFields: prevState.error.invalidFields,
          },
          waiting: false,
        }));
      });
  }

  handleCreateClick(event) {
    event.preventDefault();
    const {
      name,
      university,
      subjectId: subjectId,
      semester,
      semesterStart,
      semesterEnd,
      description,
      courseAdminUserId,
      courseImg,
      imgUri,
      error
    } = this.state;

    if (error.invalidFields.size !== 0 || !university) {
      this.setState(prevState => ({
        error: {
          open: true,
          message: "El formulario cuenta con campos invalidos",
          invalidFields: prevState.error.invalidFields,
        },
      }));
      return;
    }

    const courseImgPromise = courseImg
      ? cloudinaryService.uploadFile(courseImg)
      : Promise.resolve();

    courseImgPromise
      .then(courseImgAsset => {
        return coursesService.create(
          name,
          university.name,
          subjectId,
          semester,
          semesterStart.toLocaleDateString("sv-SE"),
          semesterEnd.toLocaleDateString("sv-SE"),
          courseAdminUserId,
          description,
          (courseImgAsset && courseImgAsset.url) || imgUri
        );
      })
      .then(() => {
        this.props.history.push("/courses");
      })
      .catch(() => {
        this.setState(prevState => ({
          error: {
            open: true,
            message:
              "Hubo un error al crear el curso, revisa que los datos ingresados sean validos.",
            invalidFields: prevState.error.invalidFields,
          },
          waiting: false,
        }));
      });
  }

  handleSaveClick(event) {
    event.preventDefault();
    const {
      name,
      university,
      subjectId: subjectId,
      isCourseFinished,
      courseMarkedForDeletion,
      semester,
      semesterStart,
      semesterEnd,
      description,
      courseImg,
      imgUri
    } = this.state;
    const { course } = this.props;
    const courseImgPromise = courseImg
      ? cloudinaryService.uploadFile(courseImg)
      : Promise.resolve();

    courseImgPromise
      .then(courseImgAsset => {
        return coursesService.edit(
          course.id,
          name,
          university.name,
          subjectId,
          !isCourseFinished,
          courseMarkedForDeletion,
          semester,
          semesterStart.toLocaleDateString("sv-SE"),
          semesterEnd.toLocaleDateString("sv-SE"),
          description,
          (courseImgAsset && courseImgAsset.url) || imgUri
        );
      })
      .then(course => {
        this.props.context.set("course", course);
        this.props.history.push(`/courses/${course.id}/dashboard`);
      })
      .catch(() => {
        this.setState(prevState => ({
          error: {
            open: true,
            message:
              "Hubo un error al guardar el curso, revisa que los datos ingresados sean validos.",
            invalidFields: prevState.error.invalidFields,
          },
          waiting: false,
        }));
      });
  }

  handleAddFile(files) {
    if (!files || !files[0]) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => this.setState({ courseImg: reader.result, imgUri: null });
    reader.readAsDataURL(file);
  }

  canSaveCourse() {
    const {
      name,
      university,
      subjectId: subjectId,
      semester,
      semesterStart,
      semesterEnd,
      description,
      courseAdminUserId
    } = this.state;
    const { course, editMode } = this.props;

    if (
      !name ||
      !university ||
      !subjectId ||
      !semester ||
      !semesterStart ||
      !semesterEnd ||
      !description ||
      (!editMode && !courseAdminUserId)
    ) {
      return false;
    }
    return true;
  }

  handleActionButton(e, mode) {
    const actionTask = {
      createMode: e => this.handleCreateClick(e),
      editMode: e => this.handleSaveClick(e),
      cloneMode: e => this.handleCloneClick(e),
    };

    this.setState({ waiting: true });
    actionTask[mode](e);
  }

  render() {
    const { classes, course, editMode, cloneMode } = this.props;
    const { error, users, university, universities, waiting } = this.state;

    let mode = "createMode";
    if (editMode) mode = "editMode";
    if (cloneMode) mode = "cloneMode";

    const actionTitle = {
      createMode: "Crear",
      editMode: "Guardar",
      cloneMode: `Clonar Curso ${course ? `(ID: ${course.id})` : ""}`,
    };

    return (
      <div className={classes.root}>
        {error.open && <ErrorNotification open={error.open} message={error.message} />}
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <form noValidate className={classes.form}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Nombre del Curso"
              name="name"
              autoComplete="name"
              value={this.state.name}
              error={error.invalidFields.has("name")}
              helperText={
                error.invalidFields.has("name") &&
                "El nombre del curso estar formado por letras y numeros"
              }
              onChange={e =>
                this.handleChange(e, validate(e.target.value, /^[0-9A-zÀ-ÿ\s]+$/, "string"))
              }
            />
            <Autocomplete
              margin="normal"
              options={universities}
              id="university"
              name="university"
              autoComplete="university"
              value={university || {}}
              onChange={(event, newValue) => this.setState({ university: newValue })}
              getOptionLabel={uni => uni.name || ""}
              renderInput={params => <TextField {...params} label="Universidad" margin="normal" />}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="subjectId"
              label="Código de materia"
              name="subjectId"
              autoComplete="subjectId"
              value={this.state.subjectId}
              error={error.invalidFields.has("subjectId")}
              helperText={
                error.invalidFields.has("subjectId") &&
                "El código de materia debe estar formado por letras, numeros, guiones (_ ó -) o puntos (.)"
              }
              onChange={e =>
                this.handleChange(e, validate(e.target.value, /^[0-9a-zA-Z_.-]+$/, "string"))
              }
            />
            <Grid container className={classes.semesterFields} spacing={2}>
              <Grid item xs={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="semester"
                  label="Semestre"
                  name="semester"
                  autoComplete="semester"
                  value={this.state.semester}
                  error={error.invalidFields.has("semester")}
                  helperText={
                    error.invalidFields.has("semester") &&
                    "El semestre debe estar formada por letras, numeros, guiones (_ ó -) o puntos (.)"
                  }
                  onChange={e =>
                    this.handleChange(e, validate(e.target.value, /^[0-9a-zA-Z_-]+$/, "string"))
                  }
                />
              </Grid>
              <Grid item xs={3}>
                <KeyboardDatePicker
                  label="Comienzo"
                  fullWidth
                  required
                  disableToolbar
                  variant="inline"
                  format="MM/dd/yyyy"
                  margin="normal"
                  value={this.state.semesterStart}
                  autoComplete="semesterStart"
                  onChange={date => this.setState({ semesterStart: date })}
                  KeyboardButtonProps={{
                    "aria-label": "change date",
                  }}
                />
              </Grid>
              <Grid item xs={3}>
                <KeyboardDatePicker
                  label="Fin"
                  fullWidth
                  required
                  disableToolbar
                  variant="inline"
                  format="MM/dd/yyyy"
                  margin="normal"
                  value={this.state.semesterEnd}
                  autoComplete="semesterEnd"
                  onChange={date => this.setState({ semesterEnd: date })}
                  KeyboardButtonProps={{
                    "aria-label": "change date",
                  }}
                />
              </Grid>
            </Grid>
            {!editMode && (
              <Autocomplete
                margin="normal"
                options={users}
                id="courseAdmin"
                name="courseAdmin"
                autoComplete="courseAdmin"
                onChange={(event, newValue) => {this.setState({ 
                    courseAdminUserId: newValue.id
                });
                    console.log(newValue);
                }}
                onInputChange={(event, value, reason) => {
                    if (reason === "input") {
                        this.loadUsersOnInput(value);
                    }
                }}
                getOptionLabel={user => `${user.name} ${user.surname} (${user.username})`}
                renderInput={params => (
                  <TextField {...params} label="Usuario administrador" margin="normal" />
                )}
              />
            )}
            {editMode && (
              <div className={classes.switchFields}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={this.state.isCourseFinished || this.state.pendingConfirmationForFinished}
                      onChange={this.handleToggleFinish}
                      color="primary"
                      name="isCourseFinished"
                    />
                  }
                  label="Curso terminado"
                />
                <FormControlLabel
                  control={
                    <Switch
                      className={classes.deletionSwitch}
                      checked={this.state.courseMarkedForDeletion || this.state.pendingConfirmationForDeletion}
                      onChange={this.handleToggleDelete}
                      color="secondary"
                      name="courseMarkedForDeletion"
                    />
                  }
                  label="Marcar para eliminar"
                />
              </div>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              multiline
              rows={5}
              name="description"
              label="Descripcion del Curso"
              type="description"
              id="description"
              autoComplete="description"
              value={this.state.description}
              onChange={e => this.handleChange(e, true)}
              variant="outlined"
            />
            <div className={classes.dropzoneContainer}>
              <DropzoneArea
                filesLimit={1}
                acceptedFiles={["image/*"]}
                dropzoneText="Arrastra una imagen para el curso"
                onChange={files => this.handleAddFile(files)}
              />
            </div>
            {!waiting && (
              <Grid container justify="flex-end" spacing={2}>
                <Grid item>
                  <Button
                    variant="contained"
                    color="secondary"
                    className={classes.cancelButton}
                    onClick={e => this.handleCancelClick(e)}
                  >
                    Cancelar
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    className={classes.createButton}
                    disabled={!this.canSaveCourse()}
                    onClick={e => this.handleActionButton(e, mode)}
                  >
                    {actionTitle[mode]}
                  </Button>
                </Grid>
              </Grid>
            )}
          </form>
          <Dialog
            open={this.state.pendingConfirmationForFinished}
            onClose={this.handleCancelFinish}
            aria-labelledby="finish-confirm-title"
          >
            <DialogTitle id="finish-confirm-title">Confirmar curso terminado</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Al guardar con esta opción checkeada, el curso se moverá a la sección de cursos finalizados. Confirma para continuar.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={this.handleCancelFinish} color="primary">
                Cancelar
              </Button>
              <Button onClick={this.handleConfirmFinish} color="primary" autoFocus>
                Confirmar
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={this.state.pendingConfirmationForDeletion}
            onClose={this.handleCancelDelete}
            aria-labelledby="delete-confirm-title"
          >
            <DialogTitle id="delete-confirm-title">CONFIRMAR ELIMINACIÓN</DialogTitle>
            <DialogContent>
              <DialogContentText>
                ADVERTENCIA: Si guardas con esta opción checkeada, el curso se marcará para eliminación y será borrado en un futuro mantenimiento del sistema. Una vez eliminado, el curso NO podrá ser recuperado. ¿Confirmas que querés marcar este curso para eliminación?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={this.handleCancelDelete} color="primary">
                Cancelar
              </Button>
              <Button onClick={this.handleConfirmDelete} color="secondary" startIcon={<WarningIcon />} autoFocus>
                Confirmar
              </Button>
            </DialogActions>
          </Dialog>
          
          {waiting && (
            <DialogContent dividers className={classes.waitingDialog}>
              <DialogContentText id="scroll-dialog-description" tabIndex={-1}>
                Esto puede tardar unos segundos
              </DialogContentText>
              <CircularProgress />
            </DialogContent>
          )}
        </MuiPickersUtilsProvider>
      </div>
    );
  }
}

export default withState(withStyles(styles)(CourseForm));
