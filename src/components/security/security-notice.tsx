import { Shield, Lock, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function SecurityNotice() {
  return (
    <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
          <Shield className="h-5 w-5" />
          Enhanced Security Active
        </CardTitle>
        <CardDescription className="text-green-700 dark:text-green-300">
          Your privacy and data security are our top priorities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-start gap-3">
            <Eye className="h-4 w-4 mt-1 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <h4 className="font-medium text-green-800 dark:text-green-200">
                Privacy Protected
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Personal data like email addresses and user activities are kept private
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Lock className="h-4 w-4 mt-1 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <h4 className="font-medium text-green-800 dark:text-green-200">
                Secure Access
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Role-based permissions ensure only authorized access to sensitive features
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary" className="text-green-800 bg-green-100 dark:text-green-200 dark:bg-green-900">
            Email Privacy
          </Badge>
          <Badge variant="secondary" className="text-green-800 bg-green-100 dark:text-green-200 dark:bg-green-900">
            Admin Controls
          </Badge>
          <Badge variant="secondary" className="text-green-800 bg-green-100 dark:text-green-200 dark:bg-green-900">
            Encrypted Data
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}