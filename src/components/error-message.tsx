'use client'
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"

interface ErrorMessageProps {
    title: string;
    message: string;
    actions?: React.ReactNode;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({title="Unknown Error", message = 'An unknown error has occured', actions = null}) => {

    return (
   
            <Alert variant="destructive" role="alert" className="mb-4">
              <AlertTitle>{title}</AlertTitle>
              <AlertDescription>
                {message}
                {actions}
              </AlertDescription>
            </Alert>
    )
}

export default ErrorMessage;