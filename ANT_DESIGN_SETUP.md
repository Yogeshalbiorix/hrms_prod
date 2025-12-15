# Ant Design Integration Guide

## Installation ✅

Ant Design **v6.1.0** has been successfully installed in your HRMS project along with:
- `antd@6.1.0` - Main Ant Design library
- `@ant-design/icons@5.6.1` - Icon library

## Quick Start

### 1. Import Ant Design CSS

Add to your component or page:
```tsx
import 'antd/dist/reset.css';
```

Or import in `src/styles/global.css`:
```css
@import "antd/dist/reset.css";
```

### 2. Use the ConfigProvider

Wrap your components with the AntdProvider for consistent theming:

```tsx
import { AntdProvider } from '../lib/antd-config';

function MyComponent() {
  return (
    <AntdProvider>
      {/* Your Ant Design components here */}
    </AntdProvider>
  );
}
```

### 3. Import Components

```tsx
import { Button, Table, Card, Space, Input, Select } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';

function Example() {
  return (
    <Space>
      <Button type="primary" icon={<PlusOutlined />}>
        Add New
      </Button>
      <Input prefix={<SearchOutlined />} placeholder="Search..." />
    </Space>
  );
}
```

## Available Configuration Files

### 1. Theme Configuration
**File:** `src/lib/antd-config.tsx`

Pre-configured with:
- Primary colors matching your brand
- Custom border radius (8px)
- Control heights (40px)
- Dark theme support
- Component-specific styling

### 2. Example Component
**File:** `src/components/Examples/AntdExample.tsx`

Includes examples of:
- Tables with sorting and filtering
- Cards and statistics
- Forms and inputs
- Buttons and actions
- Dropdowns and menus
- Tags and status badges

## Common Components

### Buttons
```tsx
<Button type="primary">Primary</Button>
<Button type="default">Default</Button>
<Button type="dashed">Dashed</Button>
<Button type="text">Text</Button>
<Button type="link">Link</Button>
<Button danger>Danger</Button>
```

### Table
```tsx
<Table 
  columns={columns} 
  dataSource={data}
  pagination={{ pageSize: 10 }}
/>
```

### Form
```tsx
<Form layout="vertical" onFinish={onFinish}>
  <Form.Item label="Name" name="name" rules={[{ required: true }]}>
    <Input />
  </Form.Item>
  <Form.Item>
    <Button type="primary" htmlType="submit">Submit</Button>
  </Form.Item>
</Form>
```

### Modal
```tsx
const [open, setOpen] = useState(false);

<Modal 
  title="Add Employee" 
  open={open} 
  onOk={() => setOpen(false)}
  onCancel={() => setOpen(false)}
>
  <p>Modal content here</p>
</Modal>
```

### Message/Notification
```tsx
import { message } from 'antd';

message.success('Operation successful!');
message.error('Operation failed!');
message.warning('Warning message');
message.info('Information');
```

## Integration with Existing Components

### Option 1: Use Alongside Current UI
Keep your existing Radix UI components and use Ant Design selectively for complex components like:
- Data tables (Table)
- Advanced forms (Form)
- Charts (Charts - if needed)
- Complex pickers (DatePicker, TimePicker)

### Option 2: Gradual Migration
Replace components gradually:
1. Start with data-heavy components (tables, forms)
2. Move to interactive elements (modals, drawers)
3. Update basic components (buttons, inputs) last

## Tailwind CSS Compatibility

Ant Design works perfectly with Tailwind! Use them together:

```tsx
<Card className="shadow-lg rounded-xl">
  <Button type="primary" className="!bg-blue-600">
    Custom Styled Button
  </Button>
</Card>
```

**Tip:** Use `!` prefix in Tailwind classes to override Ant Design styles.

## Icons

Over 700+ icons available:

```tsx
import { 
  UserOutlined, 
  SettingOutlined, 
  MailOutlined,
  DashboardOutlined,
  CalendarOutlined 
} from '@ant-design/icons';

<Button icon={<UserOutlined />}>Profile</Button>
```

## Dark Mode

Toggle between light and dark themes:

```tsx
<AntdProvider isDark={isDarkMode}>
  {/* Components automatically adapt */}
</AntdProvider>
```

## Performance Tips

1. **Tree Shaking:** Import only components you use
   ```tsx
   import { Button, Input } from 'antd'; // ✅ Good
   import * from 'antd'; // ❌ Avoid
   ```

2. **CSS:** Import reset CSS once in your main layout
   ```tsx
   import 'antd/dist/reset.css';
   ```

3. **Icons:** Import specific icons
   ```tsx
   import { UserOutlined } from '@ant-design/icons'; // ✅ Good
   import * from '@ant-design/icons'; // ❌ Avoid
   ```

## Resources

- [Official Documentation](https://ant.design/components/overview/)
- [Component Demos](https://ant.design/components/button/)
- [Design Resources](https://ant.design/docs/resources)
- [GitHub](https://github.com/ant-design/ant-design)

## Testing the Installation

Run the dev server and visit a page with the AntdExample component:
```bash
npm run dev
```

Create a test page at `src/pages/antd-test.astro`:
```astro
---
import MainLayout from '../layouts/main.astro';
import AntdExample from '../components/Examples/AntdExample';
import 'antd/dist/reset.css';
---

<MainLayout>
  <AntdExample client:only="react" />
</MainLayout>
```

Visit: `http://localhost:3000/antd-test`

---

**Status:** ✅ Ant Design v6.1.0 installed and ready to use!
