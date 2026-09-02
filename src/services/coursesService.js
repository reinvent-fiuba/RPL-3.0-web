// @flow
import type { Course, Student } from "../types";

const _ = require("lodash");
const { request } = require("../utils/Request");

const users_api = {
  base_url: process.env.USERS_API_BASE_URL || "http://localhost:8000/api/v3",
};

exports.create = (
  name: string,
  university: string,
  SubjectId: string,
  semester: string,
  semesterStartDate: string,
  semesterEndDate: string,
  courseAdminUserId: string,
  description: string,
  imgUri: string
) =>
  request({
    url: `${users_api.base_url}/courses`,
    body: JSON.stringify({
      name,
      university,
      subject_id: SubjectId,
      semester,
      semester_start_date: semesterStartDate,
      semester_end_date: semesterEndDate,
      course_admin_user_id: courseAdminUserId,
      description,
      img_uri: imgUri,
    }),
    method: "POST",
  });

exports.edit = (
  id: string,
  name: string,
  university: string,
  SubjectId: string,
  active: boolean,
  deleted: boolean,
  semester: string,
  semesterStartDate: string,
  semesterEndDate: string,
  description: string,
  imgUri: string,
) =>
  request({
    url: `${users_api.base_url}/courses/${id}`,
    body: JSON.stringify({
      name,
      university,
      subject_id: SubjectId,
      active: active,
      deleted: deleted,
      semester,
      semester_start_date: semesterStartDate,
      semester_end_date: semesterEndDate,
      description,
      img_uri: imgUri,
    }),
    method: "PUT",
  });

exports.clone = (
  id: number,
  name: string,
  university: string,
  SubjectId: string,
  semester: string,
  semesterStartDate: string,
  semesterEndDate: string,
  courseAdminUserId: string,
  description: string,
  imgUri: string
) =>
  request({
    url: `${users_api.base_url}/courses`,
    body: JSON.stringify({
      id,
      name,
      university,
      subject_id: SubjectId,
      semester,
      semester_start_date: semesterStartDate,
      semester_end_date: semesterEndDate,
      course_admin_user_id: courseAdminUserId,
      description,
      img_uri: imgUri,
    }),
    method: "POST",
  });

exports.get = (courseId: number): Promise<Course> =>
  request({
    url: `${users_api.base_url}/courses/${courseId}`,
    method: "GET",
  });

exports.getAll = (): Promise<Array<Course>> =>
  request({
    url: `${users_api.base_url}/courses`,
    method: "GET",
  });

exports.getAllByUser = (userId: number): Promise<Array<Course>> =>
  request({
    url: `${users_api.base_url}/users/${userId}/courses`,
    method: "GET",
  }).then(courses => courses.map(course => _.extend(course, { enrolled: true })));

exports.getPermissions = (courseId: number): Promise<Array<String>> =>
  request({
    url: `${users_api.base_url}/courses/${courseId}/permissions`,
    method: "GET",
  });

exports.enroll = (courseId: number) =>
  request({
    url: `${users_api.base_url}/courses/${courseId}/enroll`,
    method: "POST",
  });

exports.unenroll = (courseId: number) =>
  request({
    url: `${users_api.base_url}/courses/${courseId}/unenroll`,
    method: "POST",
  });

exports.getAllStudentsByCourseId = (courseId: number): Promise<Array<Student>> =>
  request({
    url: `${users_api.base_url}/courses/${courseId}/users?role_name=student`,
    method: "GET",
  });

exports.getAllStudentsAndTeachersByCourseId = (courseId: number): Promise<Array<Student>> =>
  request({
    url: `${users_api.base_url}/courses/${courseId}/users?return_profile_pictures=true`,
    method: "GET",
  });

const patchCourseUser = (courseId: number, userId: number, courseUserDetails: any) =>
  request({
    url: `${users_api.base_url}/courses/${courseId}/users/${userId}`,
    body: JSON.stringify(courseUserDetails),
    method: "PATCH",
  });

exports.acceptStudent = (courseId: number, userId: number) =>
  patchCourseUser(courseId, userId, {
    accepted: true,
  });

exports.changeStudentRole = (courseId: number, userId: number, roleName: string) =>
  patchCourseUser(courseId, userId, {
    role: roleName,
  });

exports.deleteStudent = (courseId: number, userId: number) =>
  request({
    url: `${users_api.base_url}/courses/${courseId}/users/${userId}`,
    method: "DELETE",
  });

exports.getScoreboard = (courseId: number) =>
  request({
    url: `${users_api.base_url}/courses/${courseId}/scoreboard`,
    method: "GET",
  });
