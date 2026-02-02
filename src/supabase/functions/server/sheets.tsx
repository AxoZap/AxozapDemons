const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

interface Demon {
  name: string;
  difficulty: string;
  rating: string;
  gauntlet: boolean;
  weekly: boolean;
  event: boolean;
  attempts?: number;
}

// Get access token using service account - SIMPLIFIED VERSION
async function getAccessToken(): Promise<string> {
  try {
    console.log('📊 Getting Google Sheets access token...');
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
    if (!serviceAccountJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT environment variable not set');
    }

    console.log('✅ Service account found, parsing JSON...');
    const serviceAccount = JSON.parse(serviceAccountJson.trim());
    
    // Use googleapis library to handle authentication
    const { google } = await import('npm:googleapis@140');
    
    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: SCOPES,
    });
    
    console.log('🔐 Getting access token from JWT...');
    const tokenResponse = await auth.getAccessToken();
    
    if (!tokenResponse.token) {
      throw new Error('Failed to get access token');
    }
    
    console.log('✅ Access token obtained!');
    return tokenResponse.token;
  } catch (error) {
    console.error('❌ Error in getAccessToken:', error);
    throw error;
  }
}

// Append demon to Google Sheet
export async function appendDemonToSheet(demon: Demon): Promise<string> {
  try {
    console.log('📊 Starting Google Sheets sync for demon:', demon.name);
    
    const sheetId = Deno.env.get('GOOGLE_SHEET_ID');
    const sheetName = Deno.env.get('GOOGLE_SHEET_NAME');

    if (!sheetId || !sheetName) {
      console.error('❌ Google Sheet credentials missing');
      return 'error: credentials missing';
    }

    console.log('✅ Sheet credentials found - ID:', sheetId, 'Name:', sheetName);

    const accessToken = await getAccessToken();

    // First, find the last row with data
    console.log('🔍 Finding last row with data...');
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!A:A`;
    const readResponse = await fetch(readUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    let nextRow = 2; // Default to row 2 (after header)
    if (readResponse.ok) {
      const readData = await readResponse.json();
      if (readData.values && readData.values.length > 0) {
        nextRow = readData.values.length + 1;
        console.log('✅ Found last row:', readData.values.length, 'Next row will be:', nextRow);
      }
    }

    // Prepare row data matching the sheet format
    // Columns: Name, Difficulty, Rating, Gauntlet, Weekly, Event, Attempts
    const row = [
      demon.name,                         // A: Name
      demon.difficulty,                   // B: Difficulty
      demon.rating || '',                 // C: Rating
      demon.gauntlet ? 'TRUE' : 'FALSE',  // D: Gauntlet
      demon.weekly ? 'TRUE' : 'FALSE',    // E: Weekly
      demon.event ? 'TRUE' : 'FALSE',     // F: Event
      demon.attempts?.toString() || '',   // G: Attempts
    ];

    console.log('📝 Prepared row data:', row);

    // Update specific row instead of appending
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!A${nextRow}:G${nextRow}?valueInputOption=USER_ENTERED`;
    
    console.log('🌐 Calling Google Sheets API to update row', nextRow);
    const response = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Google Sheets API error:', error);
      return `error: ${error}`;
    }

    console.log('✅ Successfully added demon to Google Sheet:', demon.name);
    return 'success';
  } catch (error) {
    console.error('❌ Error syncing to Google Sheets:', error);
    return `error: ${error}`;
  }
}

// Update demon in Google Sheet
export async function updateDemonInSheet(demon: Demon, rank: number): Promise<string> {
  try {
    console.log('📊 Updating demon in Google Sheets:', demon.name, 'at rank', rank);
    
    const sheetId = Deno.env.get('GOOGLE_SHEET_ID');
    const sheetName = Deno.env.get('GOOGLE_SHEET_NAME');

    if (!sheetId || !sheetName) {
      console.error('❌ Google Sheet credentials missing');
      return 'error: credentials missing';
    }

    const accessToken = await getAccessToken();

    // Calculate row (rank 1 = row 2, rank 2 = row 3, etc.)
    const row = rank + 1;

    // Prepare row data matching the sheet format
    const rowData = [
      demon.name,
      demon.difficulty,
      demon.rating || '',
      demon.gauntlet ? 'TRUE' : 'FALSE',
      demon.weekly ? 'TRUE' : 'FALSE',
      demon.event ? 'TRUE' : 'FALSE',
      demon.attempts?.toString() || '',
    ];

    console.log('📝 Updating row', row, 'with data:', rowData);

    // Update the specific row
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!A${row}:G${row}?valueInputOption=USER_ENTERED`;
    
    const response = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowData],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Google Sheets API error:', error);
      return `error: ${error}`;
    }

    console.log('✅ Successfully updated demon in Google Sheet');
    return 'success';
  } catch (error) {
    console.error('❌ Error updating in Google Sheets:', error);
    return `error: ${error}`;
  }
}

// Delete demon from Google Sheet
export async function deleteDemonFromSheet(rank: number): Promise<string> {
  try {
    console.log('📊 Deleting demon from Google Sheets at rank', rank);
    
    const sheetId = Deno.env.get('GOOGLE_SHEET_ID');
    const sheetName = Deno.env.get('GOOGLE_SHEET_NAME');

    if (!sheetId || !sheetName) {
      console.error('❌ Google Sheet credentials missing');
      return 'error: credentials missing';
    }

    const accessToken = await getAccessToken();

    // Calculate row (rank 1 = row 2, rank 2 = row 3, etc.)
    const row = rank + 1;

    console.log('🗑️ Deleting row', row);

    // Get the sheet ID (tab ID, not spreadsheet ID)
    const sheetInfoUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets(properties(sheetId,title))`;
    const sheetInfoResponse = await fetch(sheetInfoUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!sheetInfoResponse.ok) {
      const error = await sheetInfoResponse.text();
      console.error('❌ Failed to get sheet info:', error);
      return `error: ${error}`;
    }

    const sheetInfo = await sheetInfoResponse.json();
    const sheet = sheetInfo.sheets.find((s: any) => s.properties.title === sheetName);
    
    if (!sheet) {
      console.error('❌ Sheet not found:', sheetName);
      return 'error: sheet not found';
    }

    const tabId = sheet.properties.sheetId;

    // Delete the row using batchUpdate
    const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`;
    const deleteResponse = await fetch(batchUpdateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          deleteDimension: {
            range: {
              sheetId: tabId,
              dimension: 'ROWS',
              startIndex: row - 1, // 0-indexed
              endIndex: row, // exclusive
            },
          },
        }],
      }),
    });

    if (!deleteResponse.ok) {
      const error = await deleteResponse.text();
      console.error('❌ Google Sheets delete error:', error);
      return `error: ${error}`;
    }

    console.log('✅ Successfully deleted demon from Google Sheet');
    return 'success';
  } catch (error) {
    console.error('❌ Error deleting from Google Sheets:', error);
    return `error: ${error}`;
  }
}