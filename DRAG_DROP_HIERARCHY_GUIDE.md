# Drag & Drop Organization Hierarchy Guide

## 🎯 Overview
The Organization Hierarchy page now includes intuitive drag-and-drop functionality to quickly reorganize your team structure without using forms or dialogs.

## ✨ Features

### Visual Drag and Drop
- **Grab any employee card** by clicking and holding
- **Drag** to another employee
- **Drop** to set reporting relationship
- **Automatic hierarchy updates** - hierarchy levels adjust automatically

### Visual Feedback
- 🔵 **Drag Handle Icon** - Top-right corner of each card shows it's draggable
- 🟦 **Blue Highlight** - Drop target is highlighted when hovering
- 🟨 **Floating Alert** - Shows who you're currently dragging
- ⚪ **Semi-transparent** - Dragged card becomes semi-transparent
- ✅ **Success Message** - Confirms the new reporting relationship

## 🎮 How to Use

### Quick Reassignment
1. **Find the employee** you want to reassign
2. **Click and hold** on their card
3. **Drag** to their new manager's card
4. **Release** to drop and update

### Example Workflow
```
Scenario: Make "John Doe" report to "Jane Smith"

1. Click and hold on John Doe's card
2. Drag over Jane Smith's card (it will highlight blue)
3. Release to drop
4. Success message: "John Doe now reports to Jane Smith"
5. Hierarchy automatically updates
```

## 🛡️ Safety Features

### Circular Reference Prevention
The system automatically prevents circular reporting structures:
- ❌ Cannot make A report to B if B reports to A
- ❌ Cannot make an employee report to their subordinate
- ❌ Cannot make an employee report to themselves
- ✅ Shows error message if attempted

### Hierarchy Level Auto-Adjustment
When you assign a new manager:
- Employee's hierarchy level = Manager's level + 1
- Automatically maintains proper hierarchy depth
- CEO stays at level 1, subordinates cascade down

## 🎨 Visual Indicators

### Card States
| State | Visual | Meaning |
|-------|--------|---------|
| Normal | White background, gray border | Ready to drag/drop |
| Dragging | Semi-transparent (50%) | Currently being dragged |
| Drop Target | Blue background, dashed border | Valid drop zone |
| Hover | Lifted shadow, blue border | Mouse hovering |

### Status Indicators
- **Green dot** ✅ - Employee is clocked in (active)
- **Gray dot** ⚪ - Employee is clocked out (inactive)
- **Blue handle** 🔵 - Drag handle (top-right of card)

## ⚙️ Technical Details

### What Gets Updated
When you drop an employee on a new manager:
```json
{
  "manager_id": [new_manager_id],
  "hierarchy_level": [new_manager_level + 1]
}
```

### Database Changes
- Employee's `manager_id` is updated to the new manager
- Employee's `hierarchy_level` is recalculated
- Changes are saved immediately to the database
- Hierarchy view refreshes automatically

## 💡 Tips & Best Practices

### Efficient Reorganization
1. **Start from top** - Assign top-level managers first
2. **Work downward** - Then assign their subordinates
3. **Use bulk for teams** - For entire teams, use "Assign Team" feature
4. **Drag for individuals** - Use drag-drop for quick individual changes

### When to Use Drag vs Edit
| Use Drag & Drop | Use Edit Button |
|----------------|----------------|
| Quick reassignments | Changing position titles |
| Visual reorganization | Setting specific hierarchy levels |
| Moving individuals | Updating multiple fields |
| Immediate changes | Detailed employee info |

### Best Workflow
1. **Setup structure** - Use "Assign Team" for initial bulk setup
2. **Fine-tune** - Use drag-drop for individual adjustments
3. **Maintain** - Use drag-drop for ongoing changes

## 🔍 Troubleshooting

### Drag Not Working
**Problem:** Cards won't drag

**Solutions:**
- Ensure you're clicking on the card itself (not buttons)
- Check if browser supports HTML5 drag and drop
- Try refreshing the page
- Look for the blue drag handle icon

### Drop Not Accepting
**Problem:** Can't drop on certain employees

**Solutions:**
- Check for circular reference errors in console
- Ensure target employee exists in database
- Verify you're not dropping on the same employee
- Check network connection for API calls

### Changes Not Saving
**Problem:** Hierarchy doesn't update after drop

**Solutions:**
- Check browser console for errors
- Verify API endpoint is accessible
- Check authentication token is valid
- Ensure database has manager_id column

## 🎯 Use Cases

### New Hire Assignment
```
1. Drag new employee card
2. Drop on their manager
3. Done! They're in the org chart
```

### Department Reorganization
```
1. Drag team members one by one
2. Drop on new department head
3. Entire team structure updates
```

### Promotion Scenario
```
1. Edit promoted employee (set new position)
2. Drag their new team members
3. Drop on promoted employee's card
4. They now manage their team
```

### Temporary Reassignment
```
1. Drag employee to temporary manager
2. Complete project
3. Drag back to original manager
```

## 🚀 Advanced Features

### Keyboard Accessibility
- Focus on cards with Tab key
- Space/Enter to start drag (future enhancement)
- Arrow keys to navigate (future enhancement)

### Mobile Support
- Touch and hold to start drag
- Move finger to target
- Release to drop
- Same visual feedback as desktop

### Batch Operations
For multiple reassignments:
1. Use drag-drop for first few
2. Observe the pattern
3. Use "Assign Team" for bulk remaining

## 📊 Performance

### Optimizations
- Smooth animations (0.3s transitions)
- Immediate visual feedback
- Async API calls don't block UI
- Automatic hierarchy refresh

### Scale
- Works with 1-1000+ employees
- Grid layout for large flat structures
- Tree layout for deep hierarchies
- Scroll automatically for large trees

## 🔐 Permissions

### Who Can Use Drag & Drop
- **Admins** - Full drag-drop access
- **HR** - Full drag-drop access
- **Managers** - Can only reorganize their team (future)
- **Employees** - View only (cannot drag)

## 📝 Changelog

### Version 1.0 (Current)
- ✅ Basic drag and drop functionality
- ✅ Visual feedback and indicators
- ✅ Circular reference prevention
- ✅ Auto hierarchy level adjustment
- ✅ Success/error messages
- ✅ Drag handle indicator
- ✅ Drop zone highlighting

### Coming Soon
- ⏳ Multi-select drag (move multiple employees)
- ⏳ Undo/Redo functionality
- ⏳ Drag to "unassign" (remove manager)
- ⏳ Keyboard navigation
- ⏳ Touch gesture improvements

## 🆘 Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Look at browser console for errors
3. Verify database schema includes manager_id
4. Check API endpoints are working
5. Review ORGANIZATION_HIERARCHY_GUIDE.md

## 🎓 Training Tips

### For New Users
1. **Watch the demo** - Have someone show you
2. **Try on test data** - Practice with sample employees
3. **Use the alert** - Read the blue info banner
4. **Start simple** - Move one employee first
5. **Observe feedback** - Watch the visual indicators

### For Administrators
1. **Train managers** - Show them drag-drop basics
2. **Set expectations** - Explain circular reference prevention
3. **Monitor usage** - Check for errors in logs
4. **Provide support** - Share this guide
5. **Gather feedback** - Improve the experience

## ✅ Quick Reference

### Gestures
- **Click + Hold** = Start drag
- **Move** = Drag to target
- **Release** = Drop and assign
- **Esc** = Cancel drag (browser default)

### Visual Cues
- 🔵 Blue handle = Draggable
- 🟦 Blue highlight = Drop zone
- ⚪ Semi-transparent = Dragging
- ✅ Green dot = Active
- ⚫ Gray dot = Inactive

### Common Actions
- Reassign → Drag to new manager
- View hierarchy → Look at connections
- Search → Use search box
- Edit details → Click Edit button
- Bulk assign → Use Assign Team page
