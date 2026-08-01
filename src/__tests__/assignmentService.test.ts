import { parseAssignmentApiError } from '../services/assignmentService';

describe('assignmentService', () => {
  it('parses API error body', async () => {
    const response = {
      json: async () => ({ detail: 'Assignment failed.' }),
    } as Response;
    await expect(parseAssignmentApiError(response)).resolves.toBe('Assignment failed.');
  });
});
