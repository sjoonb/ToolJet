//TODO: removed current user subject, updated subject, update user fns
import { BehaviorSubject } from 'rxjs';
import {
  handleResponse,
  setCookie,
  getCookie,
  eraseCookie,
  handleResponseWithoutValidation,
  authHeader,
} from '@/_helpers';
import { excludeWorkspaceIdFromURL } from '@/_helpers/utils';
import config from 'config';

const currentSessionSubject = new BehaviorSubject({
  current_organization_id: null,
  current_organization_name: null,
  super_admin: null,
  admin: null,
  group_permissions: null,
  app_group_permissions: null,
  organizations: [],
  authentication_status: null,
});

export const authenticationService = {
  login,
  getOrganizationConfigs,
  logout,
  clearUser,
  signup,
  verifyToken,
  verifyOrganizationToken,
  onboarding,
  setupAdmin,
  currentSession: currentSessionSubject.asObservable(),
  get currentSessionValue() {
    return currentSessionSubject.value;
  },
  updateCurrentSession(data) {
    currentSessionSubject.next(data);
  },
  signInViaOAuth,
  resetPassword,
  saveLoginOrganizationId,
  getLoginOrganizationId,
  deleteLoginOrganizationId,
  forgotPassword,
  resendInvite,
  authorize,
  validateSession,
};

function login(email, password, organizationId) {
  const requestOptions = {
    method: 'POST',
    headers: {
      ...(organizationId &&
        authenticationService.currentUserValue && {
          Authorization: `Bearer ${authenticationService.currentUserValue.auth_token}`,
        }),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  };

  return fetch(`${config.apiUrl}/authenticate${organizationId ? `/${organizationId}` : ''}`, requestOptions)
    .then(handleResponseWithoutValidation)
    .then((user) => {
      // store user details and jwt token in local storage to keep user logged in between page refreshes
      // updateUser(user); TODO: update current session
      return user;
    });
}

function validateSession() {
  const requestOptions = {
    method: 'GET',
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/session`, requestOptions).then(handleResponseWithoutValidation);
}

function saveLoginOrganizationId(organizationId) {
  organizationId && setCookie('login-workspace', organizationId);
}

function getLoginOrganizationId() {
  return getCookie('login-workspace');
}

function deleteLoginOrganizationId() {
  eraseCookie('login-workspace');
}

function getOrganizationConfigs(organizationId) {
  const requestOptions = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  };

  return fetch(
    `${config.apiUrl}/organizations/${organizationId ? `${organizationId}/` : ''}public-configs`,
    requestOptions
  )
    .then(handleResponse)
    .then((configs) => configs?.sso_configs);
}

function signup(email, name, password) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password }),
  };

  return fetch(`${config.apiUrl}/signup`, requestOptions)
    .then(handleResponse)
    .then((user) => {
      return user;
    });
}
function resendInvite(email) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  };

  return fetch(`${config.apiUrl}/resend-invite`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      return response;
    });
}
function onboarding({ companyName, companySize, role, token, organizationToken, source, password }) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(companyName?.length > 0 && { companyName }),
      ...(companySize?.length > 0 && { companySize }),
      ...(role?.length > 0 && { role }),
      ...(token?.length > 0 && { token }),
      ...(organizationToken?.length > 0 && { organizationToken }),
      ...(source?.length > 0 && { source }),
      ...(password?.length > 0 && { password }),
    }),
  };

  return fetch(`${config.apiUrl}/setup-account-from-token`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      return response;
    });
}
function setupAdmin({ companyName, companySize, name, role, workspace, password, email }) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyName,
      companySize,
      role,
      name,
      workspace,
      email,
      password,
    }),
  };
  return fetch(`${config.apiUrl}/setup-admin`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      return response;
    });
}

function verifyOrganizationToken(token) {
  const requestOptions = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  };
  return fetch(`${config.apiUrl}/verify-organization-token?token=${token}`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      return response;
    });
}
function verifyToken(token, organizationToken) {
  const requestOptions = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  };
  return fetch(
    `${config.apiUrl}/verify-invite-token?token=${token}${
      organizationToken ? `&organizationToken=${organizationToken}` : ''
    }`,
    requestOptions
  )
    .then(handleResponse)
    .then((response) => {
      return response;
    });
}

function forgotPassword(email) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  };

  return fetch(`${config.apiUrl}/forgot-password`, requestOptions).then(handleResponse);
}

function resetPassword(params) {
  const { token, password } = params;

  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  };

  return fetch(`${config.apiUrl}/reset-password`, requestOptions).then(handleResponse);
}

function logout() {
  clearUser();
  const loginPath = (window.public_config?.SUB_PATH || '/') + 'login';
  const pathname = window.public_config?.SUB_PATH
    ? window.location.pathname.replace(window.public_config?.SUB_PATH, '')
    : window.location.pathname;
  window.location.href = loginPath + `?redirectTo=${excludeWorkspaceIdFromURL(pathname)}`;
}

function clearUser() {
  // remove user from local storage to log user out
  // currentUserSubject.next(null);
}

function signInViaOAuth(configId, ssoType, ssoResponse) {
  const organizationId = getLoginOrganizationId();
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ ...ssoResponse, organizationId }),
  };

  const url = configId ? configId : `common/${ssoType}`;

  return fetch(`${config.apiUrl}/oauth/sign-in/${url}`, requestOptions)
    .then(handleResponseWithoutValidation)
    .then((user) => {
      if (!user.redirect_url) {
        // updateUser(user); TODO: update current session
      }
      return user;
    });
}

function authorize() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/authorize`, requestOptions).then(handleResponseWithoutValidation);
}
