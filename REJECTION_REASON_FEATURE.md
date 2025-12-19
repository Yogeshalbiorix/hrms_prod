# Rejection Reason Feature - Complete Guide

## Overview
Leave request rejection के लिए proper rejection reason functionality implement की गई है। अब admin जब भी कोई leave reject करेगा, तो उसे detailed reason provide करना होगा जो employee को email में भेजा जाएगा और dashboard पर भी दिखेगा।

## Features Implemented

### ✅ Database Structure
- **Column Name:** `rejection_reason`
- **Type:** TEXT
- **Nullable:** Yes
- **Purpose:** Store detailed reason when leave is rejected

### ✅ Admin View (Leave Management)

#### 1. **Rejection Modal**
जब admin "Reject" button click करता है तो एक modal खुलता है:

**Features:**
- 📝 Employee details display (name, employee code, leave type, duration, reason)
- 📝 Large TextArea (5 rows) for rejection reason
- ✅ **Required field** - Rejection reason mandatory है
- ✅ **Minimum 10 characters** - Short messages allowed नहीं हैं
- ✅ **Maximum 500 characters** with character counter
- ⚠️ Real-time validation with error message
- 💡 Helpful placeholder text with examples:
  - Insufficient staffing during requested period
  - Leave quota exceeded
  - Documentation not provided
  - Business critical period
- 📧 Email notification warning

**Validation:**
```javascript
// Minimum 10 characters required
if (rejectionReason.trim().length < 10) {
  message.error('Rejection reason must be at least 10 characters long');
  return;
}
```

#### 2. **Rejection Reason Column in Table**
- Separate column for rejection reason
- Only shows for rejected leaves
- Tooltip on hover for full text
- Ellipsis for long text
- Red color with warning icon
- "No reason provided" text if rejection reason missing

### ✅ Employee View (User Dashboard)

#### 1. **Rejection Reason Column**
- **Separate dedicated column** for rejection reason
- Only visible for rejected leaves
- Shows "-" for non-rejected leaves
- Tooltip for full text viewing
- Danger (red) text color
- Warning icon (ExclamationCircleOutlined)
- Ellipsis for long text (max-width: 180px)
- Column width: 200px

#### 2. **Clean Status Display**
- Status column shows only the status tag
- Rejection reason moved to separate column
- No duplicate information
- Better table readability

### ✅ Email Notification
Rejection के बाद employee को email में rejection reason include होता है:
```javascript
sendActivityEmail(
  employee.email,
  userName,
  'leave_rejection',
  {
    leave_type: leave.leave_type,
    start_date: leave.start_date,
    end_date: leave.end_date,
    rejection_reason: body.rejection_reason
  }
)
```

## How to Use

### For Admins (Rejecting Leave):

1. **Navigate to Leave Management**
   - Admin Dashboard → Leave Management

2. **Find Pending Leave Request**
   - Look for leaves with "PENDING" status

3. **Click Reject Button**
   - Click the red reject icon (🚫)
   - Rejection modal will open

4. **Fill Rejection Reason**
   - View employee details in the card
   - Enter detailed reason (minimum 10 characters)
   - Use helpful examples provided in placeholder
   - Character counter shows remaining characters

5. **Validation Checks:**
   - ❌ Empty reason → Error: "Please provide a reason for rejection"
   - ❌ Less than 10 chars → Error: "Rejection reason must be at least 10 characters long"
   - ✅ 10-500 chars → Valid

6. **Submit Rejection**
   - Click "Reject" button (red button)
   - Success message appears
   - Email sent to employee
   - Table refreshes

### For Employees (Viewing Rejection):

1. **Navigate to Leave Section**
   - User Dashboard → Leave (sidebar)

2. **View Leave Requests Table**
   - All leave requests displayed
   - Look for "REJECTED" status (red tag)

3. **Read Rejection Reason**
   - Check "Rejection Reason" column
   - Hover on text for full reason in tooltip
   - Red text with warning icon (⚠️)

4. **Check Email**
   - Email notification received with rejection reason
   - Contains full details of rejected leave

## Database Queries

### Check Rejected Leaves with Reasons:
```sql
SELECT 
  id, 
  employee_id, 
  leave_type, 
  status, 
  rejection_reason, 
  created_at 
FROM employee_leave_history 
WHERE status = 'rejected' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Specific Employee's Rejected Leaves:
```sql
SELECT 
  l.id,
  e.first_name || ' ' || e.last_name as employee_name,
  l.leave_type,
  l.start_date,
  l.end_date,
  l.rejection_reason,
  l.approved_by,
  l.approval_date
FROM employee_leave_history l
JOIN employees e ON l.employee_id = e.id
WHERE l.status = 'rejected' AND l.employee_id = 10;
```

### Update Rejection Reason (if needed):
```sql
UPDATE employee_leave_history 
SET rejection_reason = 'Updated reason here' 
WHERE id = 5;
```

## API Endpoints

### PUT /api/leaves/[id]
**Purpose:** Update leave status (including rejection)

**Request Body (for rejection):**
```json
{
  "status": "rejected",
  "approval_date": "2025-12-18T12:00:00Z",
  "approved_by": "Admin Name",
  "rejection_reason": "Insufficient staffing during requested period",
  "notes": "Insufficient staffing during requested period"
}
```

**Validation:**
- `rejection_reason` is stored separately
- Also copied to `notes` for backward compatibility
- Minimum 10 characters enforced in UI

## UI Components Updated

### Files Modified:
1. ✅ `src/components/Dashboard/UserDashboard.tsx`
   - Added separate rejection reason column
   - Removed duplicate display from status column
   - Added Tooltip for full text viewing
   - Better formatting with icon and red color

2. ✅ `src/components/Dashboard/LeaveManagement.tsx`
   - Enhanced rejection modal with validation
   - Added minimum character validation (10 chars)
   - Better placeholder text with examples
   - Real-time validation feedback
   - Character counter (max 500)
   - Better error messages

## Benefits

### For Admins:
✅ Clear communication of rejection reasons
✅ Forced to provide detailed feedback
✅ Consistent rejection process
✅ Better documentation
✅ Professional communication

### For Employees:
✅ Clear understanding of rejection
✅ Proper feedback for improvement
✅ Transparency in decision making
✅ Better communication with management
✅ Email + Dashboard visibility

## Testing Checklist

### Admin Testing:
- [ ] Open Leave Management
- [ ] Click reject on pending leave
- [ ] Try empty reason (should show error)
- [ ] Try 5 characters (should show error)
- [ ] Enter 10+ characters
- [ ] Submit successfully
- [ ] Check table shows rejection reason
- [ ] Verify email sent

### Employee Testing:
- [ ] Login as employee
- [ ] Navigate to Leave section
- [ ] Find rejected leave
- [ ] Check rejection reason column
- [ ] Hover for tooltip
- [ ] Check email received
- [ ] Verify reason matches

## Examples of Good Rejection Reasons

### ✅ Good Examples:
1. "Insufficient staffing during requested period. Three team members already on leave."
2. "Project deadline approaching on Dec 25th. Your presence is critical for delivery."
3. "Leave quota for December already reached. Please request for January instead."
4. "Medical documentation required for sick leave exceeding 2 days. Please submit."

### ❌ Bad Examples (Too Short):
1. "No" ❌
2. "Not now" ❌
3. "Busy" ❌
4. "Try later" ❌

## Troubleshooting

### Issue: Rejection reason not showing
**Solution:**
1. Check if leave status is "rejected"
2. Verify rejection_reason field in database
3. Clear browser cache and refresh

### Issue: Can't submit without reason
**Solution:**
- This is by design
- Provide minimum 10 characters
- Use descriptive text

### Issue: Text too long
**Solution:**
- Maximum 500 characters allowed
- Use concise but clear language
- Split into bullet points if needed

### Issue: Old rejections without reason
**Solution:**
```sql
-- Update old records with default message
UPDATE employee_leave_history 
SET rejection_reason = 'Rejected (reason not provided in older system)' 
WHERE status = 'rejected' AND rejection_reason IS NULL;
```

## Future Enhancements (Suggestions)

1. 🎯 **Templates:** Pre-defined rejection reason templates
2. 📊 **Analytics:** Most common rejection reasons
3. 🔔 **Rich Notifications:** In-app notification for rejection
4. 📝 **Audit Log:** Track who rejected and when
5. 🗣️ **Reply Feature:** Employee can respond to rejection
6. 📱 **SMS Notification:** Send SMS along with email

## Summary

✅ **Rejection reason feature fully implemented and working**
✅ **Proper validation (min 10 chars, max 500 chars)**
✅ **Separate column in both admin and employee views**
✅ **Email notification included**
✅ **Database field exists and working**
✅ **User-friendly interface with helpful placeholders**
✅ **Real-time validation feedback**

अब rejection process पूरी तरह से transparent और professional है! 🎉
