import { Drawer } from 'expo-router/drawer';
import { DrawerContent } from '../../src/components/DrawerContent';
import { useColors } from '../../src/theme/ThemeProvider';

export default function DrawerLayout() {
  const colors = useColors();
  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { backgroundColor: colors.surface, width: 300 },
        overlayColor: 'rgba(0,0,0,0.55)',
        swipeEdgeWidth: 40,
      }}
    >
      <Drawer.Screen name="(tabs)" options={{ title: 'Aegis' }} />
    </Drawer>
  );
}
