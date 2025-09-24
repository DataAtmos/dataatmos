"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AtSignIcon } from "@/components/ui/icons/at-sign"
import { FoldersIcon } from "@/components/ui/icons/folders"
import { LoaderPinwheelIcon } from "@/components/ui/icons/loader-pinwheel"
import { UserIcon } from "@/components/ui/icons/user"
import { toast } from "@/components/ui/sonner"
import { client } from "@/lib/auth/auth-client"
import { captureEvent, captureClientError } from "@/lib/error-tracker-client"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface Invitation {
  id: string
  email: string
  role: string
  organization: {
    id: string
    name: string
    logo?: string
  }
  inviter: {
    user: {
      name: string
      email: string
    }
  }
}

interface AcceptInvitationFormProps {
  invitation: Invitation
}

export function AcceptInvitationForm({ invitation }: AcceptInvitationFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleAccept = async () => {
    setLoading(true)
    setError("")

    captureEvent('invitation_action_attempt', {
      action: 'accept',
      invitation_id: invitation.id,
      organization_name: invitation.organization.name,
      role: invitation.role,
    })

    try {
      await client.organization.acceptInvitation({
        invitationId: invitation.id,
      })

      captureEvent('invitation_action_success', {
        action: 'accept',
        invitation_id: invitation.id,
        organization_name: invitation.organization.name,
        role: invitation.role,
      })

      router.push("/console/profile")
      toast.success("Invitation accepted successfully!")
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to accept invitation"
      
      captureClientError(err instanceof Error ? err : new Error(errorMessage), {
        source: 'invitation-accept',
        additionalData: {
          invitation_id: invitation.id,
          organization_name: invitation.organization.name,
          role: invitation.role,
        },
      })

      setError(errorMessage)
      toast.error("Failed to accept invitation")
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    setError("")

    captureEvent('invitation_action_attempt', {
      action: 'reject',
      invitation_id: invitation.id,
      organization_name: invitation.organization.name,
      role: invitation.role,
    })

    try {
      await client.organization.rejectInvitation({
        invitationId: invitation.id,
      })

      captureEvent('invitation_action_success', {
        action: 'reject',
        invitation_id: invitation.id,
        organization_name: invitation.organization.name,
        role: invitation.role,
      })

      toast.success("Invitation declined")
      router.push("/console")
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to reject invitation"
      
      captureClientError(err instanceof Error ? err : new Error(errorMessage), {
        source: 'invitation-reject',
        additionalData: {
          invitation_id: invitation.id,
          organization_name: invitation.organization.name,
          role: invitation.role,
        },
      })

      setError(errorMessage)
      toast.error("Failed to decline invitation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <FoldersIcon size={12} />
          </div>
        </div>
        <CardTitle>Organization Invitation</CardTitle>
        <CardDescription>You&apos;ve been invited to join an organization</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-md space-y-3">
            <div className="flex items-center gap-3">
              <FoldersIcon size={12} />
              <div>
                <p className="font-medium">{invitation.organization.name}</p>
                <p className="text-sm text-muted-foreground">Organization</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UserIcon size={12} />
              <div>
                <p className="font-medium">{invitation.inviter.user.name}</p>
                <p className="text-sm text-muted-foreground">Invited by</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <AtSignIcon size={12} />
              <div>
                <p className="font-medium capitalize">{invitation.role}</p>
                <p className="text-sm text-muted-foreground">Role</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">{error}</div>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleReject} variant="outline" className="flex-1" disabled={loading}>
            {loading ? <LoaderPinwheelIcon size={12} /> : "Decline"}
          </Button>
          <Button onClick={handleAccept} className="flex-1" disabled={loading}>
            {loading ? (
              <>
                <LoaderPinwheelIcon size={12} />
                Accepting...
              </>
            ) : (
              "Accept Invitation"
            )}
          </Button>
        </div>

        <div className="text-center border-t pt-4">
          <p className="text-xs text-muted-foreground">
            By accepting, you&apos;ll be able to collaborate with the {invitation.organization.name}{" "}
            team.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
