'use client'

import { useAndroidDetection, getAndroidClasses } from '@/hooks/useAndroidDetection'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function AndroidTestComponent() {
  const androidInfo = useAndroidDetection()

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Android Device Detection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>Is Android: <Badge variant={androidInfo.isAndroid ? "default" : "secondary"}>{androidInfo.isAndroid ? "Yes" : "No"}</Badge></div>
            <div>Is Chrome: <Badge variant={androidInfo.isChrome ? "default" : "secondary"}>{androidInfo.isChrome ? "Yes" : "No"}</Badge></div>
            <div>Is Samsung: <Badge variant={androidInfo.isSamsung ? "default" : "secondary"}>{androidInfo.isSamsung ? "Yes" : "No"}</Badge></div>
            <div>Device Type: <Badge variant="outline">{androidInfo.deviceType}</Badge></div>
            <div>Screen Size: <Badge variant="outline">{androidInfo.screenWidth}x{androidInfo.screenHeight}</Badge></div>
            <div>Pixel Ratio: <Badge variant="outline">{androidInfo.pixelRatio}x</Badge></div>
            <div>Orientation: <Badge variant="outline">{androidInfo.orientation}</Badge></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Android-Specific Classes Applied</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className={getAndroidClasses(androidInfo, "p-4 bg-blue-100 rounded-lg")}>
              <p className="font-medium">This card uses Android-specific classes</p>
              <p className="text-sm text-gray-600">Check the applied classes in dev tools</p>
            </div>
            
            <div className={getAndroidClasses(androidInfo, "grid grid-cols-1 android-sm:grid-cols-2 android-md:grid-cols-3 gap-2")}>
              <div className="p-2 bg-gray-100 rounded">Item 1</div>
              <div className="p-2 bg-gray-100 rounded">Item 2</div>
              <div className="p-2 bg-gray-100 rounded">Item 3</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Android Breakpoint Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="android-xs:bg-red-100 android-sm:bg-yellow-100 android-md:bg-green-100 android-lg:bg-blue-100 android-xl:bg-purple-100 p-4 rounded">
              <p className="android-xs:text-2xs android-sm:text-xs android-md:text-sm android-lg:text-base android-xl:text-lg">
                This text changes size based on Android device type
              </p>
            </div>
            
            <div className="android-landscape:bg-orange-100 p-4 rounded">
              <p className="android-landscape:text-sm">
                This section is optimized for Android landscape mode
              </p>
            </div>
            
            <div className="android-hd:bg-pink-100 android-uhd:bg-indigo-100 p-4 rounded">
              <p className="android-hd:text-sm android-uhd:text-base">
                This section adapts to Android display density
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
